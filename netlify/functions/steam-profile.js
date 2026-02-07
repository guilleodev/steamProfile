exports.handler = async (event) => {
  try {
    const { type, value } = event.queryStringParameters || {};

    if (!type || !value) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Faltan parámetros (type, value)." }),
      };
    }

    const key = process.env.STEAM_API_KEY;
    if (!key) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Falta STEAM_API_KEY (revisa .env y reinicia netlify dev).",
        }),
      };
    }

    const steam = async (url) => {
      const r = await fetch(url);
      const j = await r.json();
      return { ok: r.ok, status: r.status, json: j };
    };

    let steamid = String(value).trim();

    // 0) Resolve vanity -> steamid64
    if (type === "vanity") {
      const resolveUrl =
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/` +
        `?key=${encodeURIComponent(key)}&vanityurl=${encodeURIComponent(steamid)}`;

      const r1 = await steam(resolveUrl);
      if (r1.json?.response?.success !== 1) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Usuario vanity no encontrado." }),
        };
      }
      steamid = r1.json.response.steamid;
    } else if (type !== "steamid") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "type inválido. Usa 'vanity' o 'steamid'." }),
      };
    }

    // 1) Profile
    const profileUrl =
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
      `?key=${encodeURIComponent(key)}&steamids=${encodeURIComponent(steamid)}`;

    const p = await steam(profileUrl);
    const player = p.json?.response?.players?.[0];
    if (!player) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "No se encontró el perfil." }),
      };
    }

    // 2) Level
    const levelUrl =
      `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}`;

    let level = null;
    try {
      const lvl = await steam(levelUrl);
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
      const b = await steam(badgesUrl);
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
            appid: x.appid || null,          // 👈 AÑADIR
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
      const g = await steam(ownedUrl);

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
    } catch (e) {
      gamesPrivacy = `error_exception`;
    }

    // 4) Recently played
    const recentUrl =
      `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}`;

    let recent = { games: [] };
    try {
      const rg = await steam(recentUrl);
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
      // ignore
    }

    // 5) Friends list
    const friendsUrl =
      `https://api.steampowered.com/ISteamUser/GetFriendList/v1/` +
      `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}&relationship=friend`;

    let friends = null;
    let friendsPrivacy = "ok";

    try {
      const fr = await steam(friendsUrl);
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

          const sum = await steam(summariesUrl);
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

    // Final payload
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
      games,
      recent,
      friends,
      privacy: {
        games: gamesPrivacy,
        friends: friendsPrivacy,
      },
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error interno.", detail: e.message }),
    };
  }
};