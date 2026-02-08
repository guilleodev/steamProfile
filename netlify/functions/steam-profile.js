const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

const ALLOWED_ORIGINS = null;

const CACHE_SECONDS = 300;

// Límites básicos anti-abuso
const MAX_VALUE_LEN = 120;

function corsHeaders(origin) {

  if (!origin) return {};

  if (ALLOWED_ORIGINS && !ALLOWED_ORIGINS.has(origin)) {
    // Origen no permitido
    return { "Access-Control-Allow-Origin": "null", Vary: "Origin" };
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(statusCode, body, origin, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders(origin),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function clampStr(x) {
  return String(x ?? "").trim();
}

function parseInput(typeRaw, valueRaw) {
  const type = clampStr(typeRaw).toLowerCase();
  let value = clampStr(valueRaw);

  if (!type || !value) return { error: "Faltan parámetros (type, value)." };
  if (value.length > MAX_VALUE_LEN) return { error: "El parámetro value es demasiado largo." };

  const isUrl = /^https?:\/\/steamcommunity\.com\/(id|profiles)\//i.test(value);
  if (isUrl) {
    try {
      const u = new URL(value);
      const parts = u.pathname.split("/").filter(Boolean);
      const kind = parts[0];
      const slug = parts[1] || "";
      if (kind === "profiles") return { type: "steamid", value: slug };
      if (kind === "id") return { type: "vanity", value: slug };
    } catch (_) {
  
    }
  }

  if (type !== "vanity" && type !== "steamid") {
    return { error: "type inválido. Usa 'vanity' o 'steamid' (o pasa una URL steamcommunity)." };
  }

  if (type === "steamid") {
    if (!/^\d{16,20}$/.test(value)) return { error: "steamid inválido (debe ser numérico, tipo SteamID64)." };
  } else {
    if (!/^[a-zA-Z0-9_-]{2,64}$/.test(value)) return { error: "vanity inválido (usa letras/números/_-)." };
  }

  return { type, value };
}

async function steamFetch(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, { signal: controller.signal });
    const text = await r.text();
    let j = null;
    try {
      j = text ? JSON.parse(text) : null;
    } catch (_) {
      j = null;
    }
    return { ok: r.ok, status: r.status, json: j };
  } finally {
    clearTimeout(t);
  }
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { ...corsHeaders(origin) },
      body: "",
    };
  }

  try {
    const { type: typeRaw, value: valueRaw } = event.queryStringParameters || {};
    const parsed = parseInput(typeRaw, valueRaw);
    if (parsed.error) return json(400, { error: parsed.error }, origin);

    const key = process.env.STEAM_API_KEY;
    if (!key) {
      return json(
        500,
        { error: "Falta STEAM_API_KEY (configura la variable en Netlify o en tu .env local)." },
        origin
      );
    }

    let steamid = parsed.value;

    if (parsed.type === "vanity") {
      const resolveUrl =
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/` +
        `?key=${encodeURIComponent(key)}&vanityurl=${encodeURIComponent(steamid)}`;

      const r1 = await steamFetch(resolveUrl);
      if (r1.json?.response?.success !== 1 || !r1.json?.response?.steamid) {
        return json(404, { error: "Usuario vanity no encontrado." }, origin, {
          "Cache-Control": "public, max-age=60",
        });
      }
      steamid = r1.json.response.steamid;
    }

    // 1) Profile
    const profileUrl =
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
      `?key=${encodeURIComponent(key)}&steamids=${encodeURIComponent(steamid)}`;

    const p = await steamFetch(profileUrl);
    const player = p.json?.response?.players?.[0];
    if (!player) {
      return json(404, { error: "No se encontró el perfil." }, origin, {
        "Cache-Control": "public, max-age=60",
      });
    }

    // 2) Level
    const levelUrl =
      `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}`;

    let level = null;
    try {
      const lvl = await steamFetch(levelUrl);
      if (lvl.json?.response && typeof lvl.json.response.player_level === "number") {
        level = lvl.json.response.player_level;
      }
    } catch (_) {

    }

    // 2.5) Badges
    const badgesUrl =
      `https://api.steampowered.com/IPlayerService/GetBadges/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}`;

    let badges = null;
    let badgesPrivacy = "ok";

    try {
      const b = await steamFetch(badgesUrl);
      const r = b.json?.response;

      if (!r || !Array.isArray(r.badges)) {
        badgesPrivacy = "private";
      } else {
        const sample = r.badges
          .slice()
          .sort((a, b) => (b.level || 0) - (a.level || 0))
          .slice(0, 6)
          .map((x) => ({
            badgeid: x.badgeid,
            appid: x.appid || null,
            level: x.level || 0,
            completion_time: x.completion_time || null,
            xp: x.xp || 0,
            scarcity: x.scarcity || 0,
          }));

        badges = {
          total: r.badges.length,
          player_xp: r.player_xp ?? null,
          player_level: r.player_level ?? null,
          xp_needed_to_level_up: r.player_xp_needed_to_level_up ?? null,
          xp_needed_current_level: r.player_xp_needed_current_level ?? null,
          top: sample,
        };
      }
    } catch (_) {
      badgesPrivacy = "private";
    }

    // 3) Owned games
    const ownedUrl =
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}` +
      `&include_appinfo=true&include_played_free_games=true`;

    let games = { total_count: null, total_hours: null, top: [], all: [], ids: [] };
    let gamesPrivacy = "ok";

    try {
      const g = await steamFetch(ownedUrl);

      if (!g.ok) {
        gamesPrivacy = `error_${g.status}`;
      } else {
        const arr = g.json?.response?.games;
        const count = g.json?.response?.game_count;

        if (!Array.isArray(arr)) {
          gamesPrivacy = "private";
        } else {
          const totalMinutes = arr.reduce((sum, it) => sum + (it.playtime_forever || 0), 0);
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

          const sorted = [...arr].sort(
            (a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0)
          );

          const top = sorted.slice(0, 10);
          const all = sorted.map((x) => ({
            appid: x.appid,
            name: x.name,
            playtime_forever: x.playtime_forever || 0,
          }));
          const ids = all.map((x) => x.appid);

          games = {
            total_count: typeof count === "number" ? count : arr.length,
            total_hours: totalHours,
            ids,
            all,
            top: top.map((x) => ({
              appid: x.appid,
              name: x.name,
              playtime_forever: x.playtime_forever || 0,
            })),
          };
        }
      }
    } catch (_) {
      gamesPrivacy = "error_exception";
    }

    // 4) Recently played
    const recentUrl =
      `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}`;

    let recent = { games: [] };
    try {
      const rg = await steamFetch(recentUrl);
      const arr = rg.json?.response?.games;
      if (Array.isArray(arr)) {
        recent.games = arr
          .sort((a, b) => (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0))
          .slice(0, 3)
          .map((x) => ({
            appid: x.appid,
            name: x.name,
            playtime_2weeks: x.playtime_2weeks || 0,
            playtime_forever: x.playtime_forever || 0,
          }));
      }
    } catch (_) {
    }

    // 5) Friends list
    const friendsUrl =
      `https://api.steampowered.com/ISteamUser/GetFriendList/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}&relationship=friend`;

    let friends = null;
    let friendsPrivacy = "ok";

    try {
      const fr = await steamFetch(friendsUrl);
      const list = fr.json?.friendslist?.friends;

      if (!Array.isArray(list)) {
        friendsPrivacy = "private";
      } else {
        const ids = list.map((f) => f.steamid).slice(0, 100);
        let online = 0;

        if (ids.length) {
          const summariesUrl =
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
            `?key=${encodeURIComponent(key)}&steamids=${encodeURIComponent(ids.join(","))}`;

          const sum = await steamFetch(summariesUrl);
          const players = sum.json?.response?.players;
          if (Array.isArray(players)) {
            online = players.filter((pl) => pl.personastate && pl.personastate > 0).length;
          }
        }

        friends = { total: list.length, online };
      }
    } catch (_) {
      friendsPrivacy = "private";
    }

    const payload = {
      profile: {
        steamid: player.steamid,
        personaname: player.personaname,
        profileurl: player.profileurl,
        avatarfull: player.avatarfull,
        personastate: player.personastate,
        gameextrainfo: player.gameextrainfo || null,
        lastlogoff: player.lastlogoff || null,
        loccountrycode: player.loccountrycode || null,
      },
      level,
      badges,
      games,
      recent,
      friends,
      privacy: {
        games: gamesPrivacy,
        friends: friendsPrivacy,
        badges: badgesPrivacy,
      },
    };

    return json(200, payload, origin, {

      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
    });
  } catch (e) {
    return json(500, { error: "Error interno." }, event.headers?.origin || "");
  }
};