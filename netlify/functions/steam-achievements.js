exports.handler = async (event) => {
  try {
    const key = process.env.STEAM_API_KEY;
    if (!key) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Falta STEAM_API_KEY." }),
      };
    }

    const steamid = String(event.queryStringParameters?.steamid || "").trim();
    const appidsRaw = String(event.queryStringParameters?.appids || "").trim();

    if (!steamid || !appidsRaw) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Faltan parámetros (steamid, appids)." }),
      };
    }

    const appids = appidsRaw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (!appids.length) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Lista appids inválida." }),
      };
    }

    const steam = async (url) => {
      const r = await fetch(url);
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, json: j };
    };

    const fetchOne = async (appid) => {
      const url =
        `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/` +
        `?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamid)}&appid=${encodeURIComponent(appid)}`;

      const r = await steam(url);

      const ach = r.json?.playerstats?.achievements;
      if (!r.ok || !Array.isArray(ach)) {
        return {
          appid: Number(appid),
          total: 0,
          unlocked: 0,
          percent: null,
          complete: false,
          status: "unavailable",
        };
      }

      const total = ach.length;
      const unlocked = ach.reduce((n, a) => n + (a.achieved ? 1 : 0), 0);
      const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;

      return {
        appid: Number(appid),
        total,
        unlocked,
        percent,
        complete: total > 0 && unlocked === total,
        status: "ok",
      };
    };

    const CONCURRENCY = 5;
    const results = [];
    let idx = 0;

    const workers = Array.from({ length: Math.min(CONCURRENCY, appids.length) }, async () => {
      while (idx < appids.length) {
        const current = appids[idx++];
        results.push(await fetchOne(current));
      }
    });

    await Promise.all(workers);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamid, results }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error interno.", detail: e.message }),
    };
  }
};