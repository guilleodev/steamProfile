// ===== DOM =====
const form = document.querySelector("#form");
const input = document.querySelector("#steamInput");
const btn = document.querySelector("#btn");
const msg = document.querySelector("#msg");

// Profile
const card = document.querySelector("#card");
const avatar = document.querySelector("#avatar");
const nameEl = document.querySelector("#name");
const statusEl = document.querySelector("#status");
const profileLink = document.querySelector("#profileLink");
const steamidEl = document.querySelector("#steamid");
const countryEl = document.querySelector("#country");
const lastlogoffEl = document.querySelector("#lastlogoff");
const levelEl = document.querySelector("#level");
const privacyNoteEl = document.querySelector("#privacyNote");

// Stats
const stats = document.querySelector("#stats");
const totalGamesEl = document.querySelector("#totalGames");
const totalHoursEl = document.querySelector("#totalHours");
const friendsEl = document.querySelector("#friends");

// Top games
const topGamesSection = document.querySelector("#topGamesSection");
const topGamesWrap = document.querySelector("#topGames");
const topGamesNote = document.querySelector("#topGamesNote");

// Recent games
const recentGamesSection = document.querySelector("#recentGamesSection");
const recentGamesWrap = document.querySelector("#recentGames");
const recentGamesNote = document.querySelector("#recentGamesNote");

// State
let currentData = null;
let lastQuery = null;

// Achievements 100%
const achSection = document.querySelector("#achSection");
const btnAchievements = document.querySelector("#btnAchievements");
const achNote = document.querySelector("#achNote");
const achProgressWrap = document.querySelector("#achProgressWrap");
const achProgressBar = document.querySelector("#achProgressBar");
const achProgressText = document.querySelector("#achProgressText");
const achCompletedList = document.querySelector("#achCompletedList");

// Compare
const input2 = document.querySelector("#steamInput2");
const compareSection = document.querySelector("#compareSection");
const compareLeft = document.querySelector("#compareLeft");
const compareRight = document.querySelector("#compareRight");
const compareSummary = document.querySelector("#compareSummary");
const compareNote = document.querySelector("#compareNote");

// ===== i18n =====
const I18N = {
  es: {
    badge: "SteamProfile → info + juegos",
    intro:
      'Pega tu <span class="text-zinc-200 font-medium">vanity</span>, <span class="text-zinc-200 font-medium">SteamID64</span> o la <span class="text-zinc-200 font-medium">URL del perfil</span>. Ej: <span class="text-zinc-200">mrpollos</span> o <span class="text-zinc-200">https://steamcommunity.com/id/<span class="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-blue-300 to-violet-300">mrpollos</span></span>',
    inputPlaceholder: "vanity / steamid64 / url",
    btnGenerate: "Buscar",

    loading: "Cargando...",
    ready: "Listo",
    writeUser: "Escribe un usuario, SteamID64 o URL.",

    // Card labels
    labelCountry: "País",
    labelLast: "Última conexión",
    openProfile: "Abrir perfil",

    // Stats titles
    statTotalGames: "Total juegos",
    statTotalHours: "Horas totales",
    statFriendsOnline: "Amigos (online)",

    // Sections
    topPlayed: "Top juegos más jugados",
    top10: "Top 10",
    recentlyPlayed: "Jugados recientemente",
    lastOnes: "Últimos",

    // Notes/errors
    privateLibraryGames: "Biblioteca privada: Steam no permite ver los juegos.",
    privateLibraryRecent: "Biblioteca privada: Steam no permite ver recientes.",
    noTopGames: "No se pudieron cargar juegos (biblioteca privada o sin datos).",
    noRecent: "No hay juegos recientes disponibles (o Steam no dio datos).",

    // Achievements
    achTitle: "Juegos completados al 100%",
    achBtnAnalyze: "Analizar TODO",
    achBtnUnavailable: "No disponible",
    achBtnNoGames: "Sin juegos",
    achBtnAnalyzing: "Analizando...",
    achBtnReanalyze: "Re-analizar TODO",
    achHint: 'Pulsa “Analizar TODO” para buscar juegos con logros al 100%.',
    achPrivate: "Biblioteca privada: Steam no permite analizar logros.",
    achNoGames: "No hay juegos disponibles para analizar.",
    achReady: (n) => `Listo para analizar ${n} juegos.`,
    achFound: (n) => `Listo ✅ Juegos al 100% encontrados: ${n}`,
    achNone: "No se encontraron juegos al 100% en tu biblioteca.",
    achProgress: (found) => `Analizando... 100% encontrados: ${found}`,
    achNoSteamid: "No se encontró steamid.",
    achNoAppids: "No hay appids para analizar.",
    achBatchWarn: (msg) => `Aviso: ${msg} (seguimos...)`,
    achNote: "Steam no expone todos los logros a través de su API pública. Algunos juegos completados al 100% pueden no detectarse automáticamente.",
    achStarting: "Iniciando análisis...",
    achievements100Label: (unlocked, total) => `Logros (100%): ${unlocked}/${total}`,
    clickToOpenSteam: "Click para abrir en Steam",
    last2Weeks: (hours) => `Últimas 2 semanas: ${hours} h`,
    totalLabel: "Total",

    // Footer
    footName: "Guillermo Redondo Camacho",
    footWeb: "Desarrollador web · Diseño web · UI",
    footDescription: "Web que muestra información pública de perfiles de Steam.",
    footSocial: "Redes",
    footRights: "GuilleODEV. Todos los derechos reservados."
  },

  en: {
    badge: "SteamProfile → card + stats",
    intro:
      'Paste a <span class="text-zinc-200 font-medium">vanity</span>, <span class="text-zinc-200 font-medium">SteamID64</span> or a <span class="text-zinc-200 font-medium">profile URL</span>. e.g. <span class="text-zinc-200">mrpollos</span> or <span class="text-zinc-200">https://steamcommunity.com/id/<span class="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-blue-300 to-violet-300">mrpollos</span></span>',
    inputPlaceholder: "vanity / steamid64 / url",
    btnGenerate: "Search",

    loading: "Loading...",
    ready: "Done",
    writeUser: "Type a user, SteamID64 or URL.",

    labelCountry: "Country",
    labelLast: "Last seen",
    openProfile: "Open profile",

    statTotalGames: "Total games",
    statTotalHours: "Total hours",
    statFriendsOnline: "Friends (online)",

    topPlayed: "Top most played games",
    top10: "Top 10",
    recentlyPlayed: "Recently played",
    lastOnes: "Latest",

    privateLibraryGames: "Private library: Steam doesn't allow viewing games.",
    privateLibraryRecent: "Private library: Steam doesn't allow recent games.",
    noTopGames: "Couldn't load games (private library or no data).",
    noRecent: "No recent games available (or Steam returned no data).",

    achTitle: "100% completed games",
    achBtnAnalyze: "Analyze ALL",
    achBtnUnavailable: "Unavailable",
    achBtnNoGames: "No games",
    achBtnAnalyzing: "Analyzing...",
    achBtnReanalyze: "Re-analyze ALL",
    achHint: 'Click “Analyze ALL” to find 100% achievements games.',
    achPrivate: "Private library: Steam doesn't allow achievements analysis.",
    achNoGames: "No games available to analyze.",
    achReady: (n) => `Ready to analyze ${n} games.`,
    achFound: (n) => `Done ✅ 100% games found: ${n}`,
    achNone: "No 100% games found in this library.",
    achProgress: (found) => `Analyzing... 100% found: ${found}`,
    achNoSteamid: "SteamID not found.",
    achNoAppids: "No appids to analyze.",
    achBatchWarn: (msg) => `Warning: ${msg} (continuing...)`,
    achNote: "Steam does not expose all achievements through its public API. Some 100% completed games may not be detected automatically.",
    achStarting: "Starting analysis...",
    achievements100Label: (unlocked, total) => `Achievements (100%): ${unlocked}/${total}`,
    clickToOpenSteam: "Click to open on Steam",
    last2Weeks: (hours) => `Last 2 weeks: ${hours} h`,
    totalLabel: "Total",

    // Footer
    footName: "Guillermo Redondo Camacho",
    footWeb: "Web developer · Web design · UI",
    footDescription: "Website that shows public information about Steam profiles.",
    footSocial: "Social Media",
    footRights: "GuilleODEV. All rights reserved."
  }
};

let currentLang = localStorage.getItem("lang") || "es";

function t(key, arg) {
  const v = I18N[currentLang]?.[key] ?? I18N.es[key];
  if (typeof v === "function") return v(arg?.unlocked ?? arg, arg?.total);
  return v ?? key;
}

function applyI18n() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key === "intro") el.innerHTML = t(key);
    else el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });

  const btnSpan = document.querySelector("#btn [data-i18n='btnGenerate']");
  if (btnSpan && !document.querySelector("#btn").disabled) btnSpan.textContent = t("btnGenerate");
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  applyI18n();
}

// ES/EN
window.addEventListener("DOMContentLoaded", () => {
  const es = document.querySelector("#langES");
  const en = document.querySelector("#langEN");
  if (es) es.addEventListener("click", () => setLang("es"));
  if (en) en.addEventListener("click", () => setLang("en"));
  applyI18n();
});

// ===== Helpers UI =====
function setMessage(text) {
  msg.textContent = text || "";
}

function setLoading(isLoading) {
  btn.disabled = isLoading;
  btn.textContent = isLoading ? t("loading") : t("btnGenerate");
}

function hideAll() {
  card.classList.add("hidden");
  stats.classList.add("hidden");
  topGamesSection.classList.add("hidden");
  recentGamesSection.classList.add("hidden");

  topGamesWrap.innerHTML = "";
  recentGamesWrap.innerHTML = "";
  topGamesNote.textContent = "";
  recentGamesNote.textContent = "";
  privacyNoteEl.textContent = "";

  if (achSection) achSection.classList.add("hidden");
  if (achProgressWrap) achProgressWrap.classList.add("hidden");
  if (achProgressBar) achProgressBar.style.width = "0%";
  if (achProgressText) achProgressText.textContent = "0/0";
  if (achCompletedList) achCompletedList.innerHTML = "";
  if (achNote) achNote.textContent = "";
  if (btnAchievements) {
    btnAchievements.disabled = false;
    btnAchievements.textContent = t("achBtnAnalyze");
  }

}

// globaltooltip

const globalTooltip = document.querySelector("#globalTooltip");

function showGlobalTooltip(anchorEl, html) {
  if (!globalTooltip || !anchorEl) return;

  globalTooltip.innerHTML = html;
  globalTooltip.classList.remove("hidden");

  const rect = anchorEl.getBoundingClientRect();
  const tooltipW = 280;
  const padding = 12;

  let left = rect.left;
  let top = rect.bottom + 10;

  if (left + tooltipW > window.innerWidth - padding) {
    left = window.innerWidth - tooltipW - padding;
  }
  if (left < padding) left = padding;

  globalTooltip.style.left = `${left}px`;
  globalTooltip.style.top = `${top}px`;
}

function hideGlobalTooltip() {
  if (!globalTooltip) return;
  globalTooltip.classList.add("hidden");
  globalTooltip.innerHTML = "";
}

window.addEventListener("scroll", hideGlobalTooltip, { passive: true });
window.addEventListener("resize", hideGlobalTooltip);

// ===== Animations (UI) =====
function animateIn(el, opts = {}) {
  if (!el) return;
  const {
    yFrom = 12,
    duration = 520,
    delay = 0,
    easing = "cubic-bezier(.16,1,.3,1)",
    scaleFrom = 0.985,
    blurFrom = 8,
  } = opts;

  el.getAnimations?.().forEach(a => a.cancel());

  el.animate(
    [
      { opacity: 0, transform: `translateY(${yFrom}px) scale(${scaleFrom})`, filter: `blur(${blurFrom}px)` },
      { opacity: 1, transform: "translateY(0px) scale(1)", filter: "blur(0px)" }
    ],
    { duration, delay, easing, fill: "both" }
  );
}

function animatePulse(el, opts = {}) {
  if (!el) return;
  const { duration = 450, easing = "cubic-bezier(.16,1,.3,1)" } = opts;
  el.getAnimations?.().forEach(a => a.cancel());

  el.animate(
    [
      { transform: "scale(1)", filter: "brightness(1)" },
      { transform: "scale(1.02)", filter: "brightness(1.1)" },
      { transform: "scale(1)", filter: "brightness(1)" }
    ],
    { duration, easing, fill: "both" }
  );
}

function animateRowIn(row, i = 0) {
  if (!row) return;
  animateIn(row, {
    yFrom: 10,
    duration: 420,
    delay: 45 * i,
    scaleFrom: 0.995,
    blurFrom: 6
  });
}

function showSection(el, opts = {}) {
  if (!el) return;
  el.classList.remove("hidden");
  requestAnimationFrame(() => animateIn(el, opts));
}

// ===== Utils =====
function parseUser(raw) {
  const value = raw.trim();
  if (!value) return null;

  const idMatch = value.match(/steamcommunity\.com\/id\/([^\/\?#]+)/i);
  if (idMatch) return { type: "vanity", value: idMatch[1] };

  const profileMatch = value.match(/steamcommunity\.com\/profiles\/(\d{16,20})/i);
  if (profileMatch) return { type: "steamid", value: profileMatch[1] };

  if (/^\d{16,20}$/.test(value)) return { type: "steamid", value };

  return { type: "vanity", value };
}

function formatDateFromUnix(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

function statusText(state, game) {
  if (game) return `Jugando: ${game}`;
  return ["Offline", "Online", "Busy", "Away", "Snooze", "Trade", "Play"][state] || "Offline";
}

function countryText(code) {
  return code ? code.toUpperCase() : "—";
}

function minutesToHours(min) {
  return Math.round((min / 60) * 10) / 10;
}

function renderGameRow(rank, game, extra = null, highlightTop = false) {
  const hours = minutesToHours(game.playtime_forever || 0);

  const row = document.createElement("div");

  // oro/plata/bronce
  let cls = "relative z-0 hover:z-50 flex items-center justify-between gap-3 rounded-lg border p-3 ";
  if (highlightTop && rank === 1) cls += "bg-yellow-600/10 border-yellow-400/40";
  else if (highlightTop && rank === 2) cls += "bg-zinc-600/10 border-zinc-300/40";
  else if (highlightTop && rank === 3) cls += "bg-orange-600/10 border-orange-400/40";
  else cls += "bg-zinc-950/40 border-zinc-800";

  row.className = cls;

  const left = document.createElement("div");
  left.className = "flex items-center gap-3 min-w-0";

  const badge = document.createElement("div");
  badge.className = "text-xs px-2 py-1 rounded-full border border-zinc-700 text-zinc-200 shrink-0";
  badge.textContent = `#${rank}`;

  // Cover
  const coverWrap = document.createElement("div");
  coverWrap.className = "shrink-0";

  const cover = document.createElement("img");
  cover.alt = game.name || `App ${game.appid}`;
  cover.loading = "lazy";
  cover.decoding = "async";
  cover.className =
    "h-[42px] w-[110px] rounded-md border border-white/10 object-cover bg-zinc-950/40";

  if (game.appid) {
    const capsule = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`;
    const header = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
    cover.src = capsule;

    cover.onerror = () => {
      cover.onerror = null;
      cover.src = header;
    };
  } else {
    cover.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="84">
        <rect width="100%" height="100%" fill="#0b0b0f"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              fill="#9ca3af" font-family="Arial" font-size="14">No image</text>
      </svg>`);
  }

  coverWrap.appendChild(cover);

  // Text + tooltip
  const wrap = document.createElement("div");
  wrap.className = "relative group min-w-0";

  const title = document.createElement("a");
  title.textContent = game.name || `App ${game.appid}`;
  title.className = "font-semibold truncate hover:underline hover:text-cyan-300";

  if (game.appid) {
    const tooltipHTML = `
    <img
      src="https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg"
      class="w-full rounded-lg mb-2 border border-white/10"
      loading="lazy"
      decoding="async"
    />
    <div class="text-zinc-300">
      ${t("totalLabel")}: <span class="text-zinc-100 font-semibold">${hours} h</span>
    </div>
    <div class="text-zinc-500 mt-1">
      ${t("clickToOpenSteam")}
    </div>
  `;

    title.addEventListener("mouseenter", () =>
      showGlobalTooltip(title, tooltipHTML)
    );
    title.addEventListener("mouseleave", hideGlobalTooltip);
  }

  if (game.appid) {
    title.href = `https://store.steampowered.com/app/${game.appid}/`;
    title.target = "_blank";
    title.rel = "noreferrer";
  } else {
    title.href = "#";
    title.onclick = (e) => e.preventDefault();
    title.classList.remove("hover:underline", "hover:text-cyan-300");
  }

  wrap.appendChild(title);

  if (extra) {
    const ex = document.createElement("div");
    ex.className = "text-xs text-zinc-400 mt-1 truncate";
    ex.textContent = extra;
    wrap.appendChild(ex);
  }

  left.appendChild(badge);
  left.appendChild(coverWrap);
  left.appendChild(wrap);

  const right = document.createElement("div");
  right.className = "text-sm text-zinc-300 shrink-0";
  right.textContent = `${hours} h`;

  row.appendChild(left);
  row.appendChild(right);

  return row;
}

// ===== Fetch profile =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const parsed = parseUser(input.value);
  if (!parsed) {
    setMessage(t("writeUser"));
    return;
  }

  lastQuery = parsed;
  setLoading(true);
  setMessage("");
  hideAll();

  try {
    const res = await fetch(
      `/.netlify/functions/steam-profile?type=${encodeURIComponent(parsed.type)}&value=${encodeURIComponent(parsed.value)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error");

    currentData = data;
    if (achSection) {
      achSection.classList.remove("hidden");

      if (data?.privacy?.games === "private") {
        if (btnAchievements) {
          btnAchievements.disabled = true;
          btnAchievements.textContent = t("achBtnUnavailable");
        }
        if (achNote) achNote.textContent = t("achPrivate");
      } else if (!Array.isArray(data?.games?.all) || data.games.all.length === 0) {
        if (btnAchievements) {
          btnAchievements.disabled = true;
          btnAchievements.textContent = t("achBtnNoGames");
        }
        if (achNote) achNote.textContent = t("achNoGames");
      } else {
        if (btnAchievements) {
          btnAchievements.disabled = false;
          btnAchievements.textContent = t("achBtnAnalyze");
        }
        if (achNote) achNote.textContent = t("achReady", data.games.all.length);
      }
    }

    // Profile
    avatar.src = data.profile.avatarfull;
    nameEl.textContent = data.profile.personaname;
    statusEl.textContent = statusText(data.profile.personastate, data.profile.gameextrainfo);
    profileLink.href = data.profile.profileurl;
    steamidEl.textContent = data.profile.steamid;
    countryEl.textContent = countryText(data.profile.loccountrycode);
    lastlogoffEl.textContent = formatDateFromUnix(data.profile.lastlogoff);
    levelEl.textContent = data.level ?? "—";
    card.classList.remove("hidden");

    // Stats
    stats.classList.remove("hidden");
    if (data.privacy?.games === "private") {
      topGamesNote.textContent = t("privateLibraryGames");
      recentGamesNote.textContent = t("privateLibraryRecent");
    }
    totalGamesEl.textContent = data.games.total_count ?? "—";
    totalHoursEl.textContent = `${data.games.total_hours ?? "—"} h`;
    friendsEl.textContent = data.friends ? `${data.friends.total} (${data.friends.online})` : "—";

    // Top games
    topGamesSection.classList.remove("hidden");

    if (Array.isArray(data.games?.top) && data.games.top.length > 0) {
      data.games.top.forEach((g, i) => {
        topGamesWrap.appendChild(renderGameRow(i + 1, g, null, true));
      });
    } else {
      topGamesNote.textContent = t("noTopGames");
    }

    // Recent
    recentGamesSection.classList.remove("hidden");

    if (Array.isArray(data.recent?.games) && data.recent.games.length > 0) {
      data.recent.games.forEach((g, i) => {
        recentGamesWrap.appendChild(
          renderGameRow(
            i + 1,
            { appid: g.appid, name: g.name, playtime_forever: g.playtime_forever || 0 },
            t("last2Weeks", minutesToHours(g.playtime_2weeks)),
            false
          )
        );
      });
    } else {
      recentGamesNote.textContent = t("noRecent");
    }

    setMessage(t("ready"));
  } catch (e) {
    setMessage(e.message);
  } finally {
    setLoading(false);
  }
});

// ===== Achievements 100% =====
let achRunning = false;

function updateAchProgress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  if (achProgressBar) achProgressBar.style.width = `${pct}%`;
  if (achProgressText) achProgressText.textContent = `${done}/${total} (${pct}%)`;
}

function renderAchCompleted(game, unlocked, total) {
  const row = renderGameRow(0, game, t("achievements100Label", { unlocked, total }), false);

  const badge = row.querySelector("div.text-xs");
  if (badge) badge.textContent = "🏆";

  row.classList.add("border-cyan-400/30", "bg-cyan-500/5");
  return row;
}

async function analyzeAchievementsAll() {
  if (!currentData || achRunning) return;

  const steamid = currentData?.profile?.steamid;
  const all = currentData?.games?.all;

  if (!steamid) {
    if (achNote) achNote.textContent = "No se encontró steamid.";
    return;
  }

  if (!Array.isArray(all) || all.length === 0) {
    if (achNote) achNote.textContent = "No hay juegos disponibles para analizar.";
    return;
  }

  const byAppId = new Map();
  for (const g of all) {
    if (g?.appid) byAppId.set(Number(g.appid), g);
  }

  const appids = [...byAppId.keys()];
  if (appids.length === 0) {
    if (achNote) achNote.textContent = "No hay appids para analizar.";
    return;
  }

  // UI init
  achRunning = true;
  if (btnAchievements) {
    btnAchievements.disabled = true;
    btnAchievements.textContent = t("achBtnAnalyzing");
  }
  if (achProgressWrap) achProgressWrap.classList.remove("hidden");
  if (achCompletedList) achCompletedList.innerHTML = "";
  if (achNote) achNote.textContent = t("achStarting");

  let done = 0;
  let found = 0;
  updateAchProgress(done, appids.length);

  // Batches
  const BATCH = 20;

  for (let i = 0; i < appids.length; i += BATCH) {
    const batch = appids.slice(i, i + BATCH);

    try {
      const url =
        `/.netlify/functions/steam-achievements?steamid=${encodeURIComponent(steamid)}` +
        `&appids=${encodeURIComponent(batch.join(","))}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error analizando logros");

      const results = Array.isArray(data?.results) ? data.results : [];

      for (const r of results) {
        done++;

        if (r?.status === "ok" && r.complete) {
          found++;
          const game = byAppId.get(Number(r.appid));
          if (game && achCompletedList) {
            achCompletedList.appendChild(renderAchCompleted(game, r.unlocked, r.total));
          }
        }

        updateAchProgress(done, appids.length);
        if (achNote) achNote.textContent = t("achProgress", found);
      }
    } catch (e) {
      done += batch.length;
      updateAchProgress(done, appids.length);
      if (achNote) achNote.textContent = t("achBatchWarn", e.message);
    }
  }

  // Final
  if (found === 0) {
    if (achNote) achNote.textContent = t("achNone");
  } else {
    if (achNote) achNote.textContent = t("achFound", found);
  }

  if (btnAchievements) {
    btnAchievements.disabled = false;
    btnAchievements.textContent = t("achBtnReanalyze");
  }
  achRunning = false;
}

// Hook
if (btnAchievements) {
  btnAchievements.addEventListener("click", () => {
    if (currentData?.privacy?.games === "private") return;
    analyzeAchievementsAll();
  });
}

// Footer
const yearEl = document.querySelector("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();