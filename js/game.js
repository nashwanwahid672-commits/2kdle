// Player data (RAW) is loaded from data/players.js
// [name, ovr, pos, team, conference, nation, continent, height (in), outside, inside, athleticism, playmaking, defense, rebounding, birth year]
const P = RAW.map((r, i) => ({ i, name: r[0], ovr: r[1], pos: r[2], team: r[3], conf: r[4], nation: r[5], cont: r[6], ht: r[7],
  os: r[8], ins: r[9], ath: r[10], ply: r[11], def: r[12], reb: r[13], by: r[14] || 0 }));
const MAX = 5;
const NUM = ["ovr", "ht", "os", "ins", "ath", "ply", "def", "reb"];
const NEAR = { ovr: 3, ht: 2, os: 3, ins: 3, ath: 3, ply: 3, def: 3, reb: 3 };
const STATS = ["os", "ins", "ath", "ply", "def", "reb"];
const LABEL = { os: "OUT", ins: "INS", ath: "ATH", ply: "PLY", def: "DEF", reb: "REB" };
const GROUP = { PG: "G", SG: "G", SF: "F", PF: "F", C: "C" };
const GROUP_NAME = { G: "Guard", F: "Forward", C: "Center" };
const TEAMS = { ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets", CHA: "Charlotte Hornets", CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers",
  DAL: "Dallas Mavericks", DEN: "Denver Nuggets", DET: "Detroit Pistons", GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers",
  LAC: "LA Clippers", LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat", MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves",
  NOP: "New Orleans Pelicans", NYK: "New York Knicks", OKC: "Oklahoma City Thunder", ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SAS: "San Antonio Spurs", TOR: "Toronto Raptors", UTA: "Utah Jazz", WAS: "Washington Wizards" };
const FLAG = {"Argentina": "🇦🇷", "Australia": "🇦🇺", "Austria": "🇦🇹", "Bahamas": "🇧🇸", "Belgium": "🇧🇪", "Bosnia and Herzegovina": "🇧🇦", "Brazil": "🇧🇷",
  "Bulgaria": "🇧🇬", "Cameroon": "🇨🇲", "Canada": "🇨🇦", "China": "🇨🇳", "Congo": "🇨🇬", "Croatia": "🇭🇷", "Czech Republic": "🇨🇿", "Denmark": "🇩🇰",
  "Dominican Republic": "🇩🇴", "DR Congo": "🇨🇩", "Egypt": "🇪🇬", "Estonia": "🇪🇪", "Finland": "🇫🇮", "France": "🇫🇷", "Georgia": "🇬🇪", "Germany": "🇩🇪",
  "Greece": "🇬🇷", "Guinea": "🇬🇳", "Haiti": "🇭🇹", "Hungary": "🇭🇺", "Israel": "🇮🇱", "Italy": "🇮🇹", "Jamaica": "🇯🇲", "Japan": "🇯🇵", "Latvia": "🇱🇻",
  "Lebanon": "🇱🇧", "Lithuania": "🇱🇹", "Mali": "🇲🇱", "Mexico": "🇲🇽", "Montenegro": "🇲🇪", "Netherlands": "🇳🇱", "New Zealand": "🇳🇿", "Nigeria": "🇳🇬",
  "Panama": "🇵🇦", "Philippines": "🇵🇭", "Poland": "🇵🇱", "Portugal": "🇵🇹", "Puerto Rico": "🇵🇷", "Romania": "🇷🇴", "Russia": "🇷🇺", "Senegal": "🇸🇳",
  "Serbia": "🇷🇸", "Slovenia": "🇸🇮", "South Sudan": "🇸🇸", "Spain": "🇪🇸", "Sweden": "🇸🇪", "Switzerland": "🇨🇭", "Turkey": "🇹🇷", "Uganda": "🇺🇬",
  "Ukraine": "🇺🇦", "United Kingdom": "🇬🇧", "United States": "🇺🇸", "Venezuela": "🇻🇪"};
const EPOCH = Date.UTC(2026, 9, 1);

function fold(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ø/g, "o").replace(/ß/g, "ss").replace(/ł/g, "l").replace(/ı/g, "i").replace(/đ/g, "d"); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function feet(n) { return Math.floor(n / 12) + "'" + (n % 12) + '"'; }
function show(k, v) { return k === "ht" ? feet(v) : String(v); }
{ const seen = {}; P.forEach(p => seen[p.name] = (seen[p.name] || 0) + 1);
  P.forEach(p => { if (seen[p.name] > 1) p.name += " (" + p.team + ")"; p.names = fold(p.name).replace(/["'.]/g, ""); p.extra = fold(p.team + " " + TEAMS[p.team] + " " + p.nation).split(/\s+/); }); }
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
function todayKey() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function dayNumber() { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5) + 1; }
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function pool(min) { return P.filter(p => p.ovr >= min); }

let S; // game state

function newState(mode) {
  if (mode === "daily") {
    const k = todayKey(), saved = store.get("2kdle-daily", null);
    const pl = pool(80), target = pl[hash("2kdle:" + k) % pl.length].i;
    if (saved && saved.date === k && saved.target === target) return { mode, date: k, target, guesses: saved.guesses, forfeit: !!saved.forfeit };
    return { mode, date: k, target, guesses: [] };
  }
  const pl = pool(+document.getElementById("diff").value);
  return { mode, target: pl[Math.floor(Math.random() * pl.length)].i, guesses: [] };
}
function status() {
  const won = S.guesses.includes(S.target);
  return { won, forfeit: !won && !!S.forfeit, over: won || !!S.forfeit || S.guesses.length >= MAX };
}
function save() { if (S.mode === "daily") store.set("2kdle-daily", { date: S.date, target: S.target, guesses: S.guesses, forfeit: !!S.forfeit }); }

function compare(g, t) {
  const c = {};
  for (const k of NUM) {
    const d = t[k] - g[k];
    c[k] = { v: show(k, g[k]), st: d === 0 ? "hit" : Math.abs(d) <= NEAR[k] ? "near" : "miss", dir: d > 0 ? "up" : d < 0 ? "down" : "" };
  }
  c.pos = { v: g.pos, st: g.pos === t.pos ? "hit" : GROUP[g.pos] === GROUP[t.pos] ? "near" : "miss" };
  c.nation = { v: g.nation, st: g.nation === t.nation ? "hit" : g.cont === t.cont ? "near" : "miss" };
  c.team = { v: g.team, title: TEAMS[g.team], st: g.team === t.team ? "hit" : g.conf === t.conf ? "near" : "miss" };
  return c;
}

// What the guesses so far pin down exactly. The card only shows exact hits.
function knowledge() {
  const t = P[S.target], K = {};
  for (const k of NUM) K[k] = null;
  const facts = { pos: null, nation: null, team: null, conf: null };
  for (const gi of S.guesses) {
    const g = P[gi], c = compare(g, t);
    for (const k of NUM) if (c[k].st === "hit") K[k] = g[k];
    if (c.pos.st === "hit") facts.pos = g.pos;
    if (c.nation.st === "hit") facts.nation = g.nation;
    if (c.team.st === "hit") { facts.team = g.team; facts.conf = g.conf; }
  }
  return { K, facts };
}

function renderCard() {
  const { over } = status(), t = P[S.target], el = document.getElementById("card");
  const { K, facts } = over ? { K: Object.fromEntries(NUM.map(k => [k, t[k]])), facts: { pos: t.pos, nation: t.nation, team: t.team, conf: t.conf } } : knowledge();
  const val = k => K[k] == null ? "?" : show(k, K[k]);
  const kn = k => K[k] == null ? "" : " known";
  const ovr = `<div class="c-ovr${kn("ovr")}">${val("ovr")}</div>`;
  const pos = `<div class="c-pos${facts.pos ? " known" : ""}">${facts.pos || "POS ?"}</div>`;
  const name = over ? esc(t.name) : "? ? ?";
  const stats = STATS.map(k => `<div class="c-stat${kn(k)}"><span>${LABEL[k]}</span><b>${val(k)}</b></div>`).join("");
  const meta = `<span class="${facts.nation ? "known" : ""}">${facts.nation ? `<i class="f" aria-hidden="true">${FLAG[facts.nation] || ""}</i>` : ""}${esc(facts.nation || "Nation ?")}</span>`
    + `<span class="${facts.conf ? "known" : ""}">${esc(facts.conf ? facts.conf + "ern Conf." : "Conference ?")}</span>`
    + `<span class="${facts.team ? "known" : ""}">${esc(facts.team ? TEAMS[facts.team] : "Team ?")}</span>`
    + `<span class="${K.ht == null ? "" : "known"}">Height ${esc(val("ht"))}</span>`;
  el.innerHTML = `<div class="c-top"><div>${ovr}${pos}</div>${facts.team ? `<div class="c-team">${esc(facts.team)}</div>` : ""}</div><div class="c-face" aria-hidden="true">${over ? "" : "?"}</div>
    <div class="c-name">${name}</div><div class="c-stats">${stats}</div><div class="c-meta">${meta}</div>`;
}

function cell(c, cls = "") {
  const arrow = c.dir === "up" ? "▲" : c.dir === "down" ? "▼" : "";
  const sr = c.st === "hit" ? "correct" : (c.dir === "up" ? "mystery player is higher" : c.dir === "down" ? "mystery player is lower" : c.st === "near" ? "close" : "wrong");
  return `<td class="${c.st} ${cls}" title="${esc(c.title ? c.title + ": " + sr : sr)}" aria-label="${esc(c.title || c.v)}, ${sr}">${esc(c.v)}${arrow ? `<span class="ar" aria-hidden="true">${arrow}</span>` : ""}</td>`;
}
function renderRows(freshIndex) {
  const t = P[S.target], tb = document.getElementById("rows");
  if (!S.guesses.length) { tb.innerHTML = `<tr class="empty"><td colspan="12">No guesses yet. Start with a big name to narrow down the conference and position, then use the arrows to close in on the ratings.</td></tr>`; return; }
  tb.innerHTML = S.guesses.map((gi, n) => {
    const g = P[gi], c = compare(g, t);
    return `<tr class="${n === freshIndex ? "fresh" : ""}"><td class="name">${esc(g.name)}<small>${g.ovr} ${g.pos} · ${g.team}</small></td>
      ${cell(c.ovr)}${cell(c.pos)}${cell(c.ht)}${cell(c.team)}${cell(c.nation, "txt")}
      ${STATS.map(k => cell(c[k])).join("")}</tr>`;
  }).reverse().join("");
  if (freshIndex != null) tb.querySelectorAll("tr.fresh td:not(.name)").forEach((td, i) => td.style.animationDelay = (i * 40) + "ms");
}

// Answer photo from Wikimedia Commons (freely licensed), looked up through Wikidata.
// Only used on the end-of-game panel. Matches a basketball player (Q3665646) born
// within a year of the player's birth year. Fails silently: no match, no photo.
const PHOTO_CACHE = new Map();
const WD = "https://www.wikidata.org/w/api.php?format=json&origin=*&";
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }
function birthYear(time) { const m = /^[+]?(\d{4})-/.exec(time || ""); return m ? +m[1] : null; }
async function findPhoto(p) {
  if (PHOTO_CACHE.has(p.i)) return PHOTO_CACHE.get(p.i);
  const job = (async () => {
    const base = p.name.replace(/ \(.*\)$/, "");
    const tries = [...new Set([base, fold(base).replace(/\b\w/g, c => c.toUpperCase()), base.replace(/ (Jr\.|Sr\.|II|III|IV)$/, "")])];
    for (const q of tries) {
      const s = await getJSON(WD + "action=wbsearchentities&type=item&language=en&limit=7&search=" + encodeURIComponent(q));
      const ids = (s.search || []).map(x => x.id); if (!ids.length) continue;
      const e = await getJSON(WD + "action=wbgetentities&props=claims&ids=" + ids.join("|"));
      for (const id of ids) {
        const c = (e.entities[id] || {}).claims || {};
        const isHooper = (c.P106 || []).some(x => x.mainsnak?.datavalue?.value?.id === "Q3665646");
        const file = c.P18?.[0]?.mainsnak?.datavalue?.value;
        const by = birthYear(c.P569?.[0]?.mainsnak?.datavalue?.value?.time);
        if (!isHooper || !file || by == null || (p.by && Math.abs(by - p.by) > 1)) continue;
        const info = await getJSON("https://commons.wikimedia.org/w/api.php?format=json&origin=*&action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&titles=" + encodeURIComponent("File:" + file));
        const ii = Object.values(info.query.pages)[0]?.imageinfo?.[0]; if (!ii?.thumburl) continue;
        const strip = h => { const d = document.createElement("div"); d.innerHTML = h || ""; return d.textContent.trim().replace(/\s+/g, " "); };
        return { src: ii.thumburl, page: ii.descriptionurl, artist: strip(ii.extmetadata?.Artist?.value).slice(0, 60) || "Unknown author", license: strip(ii.extmetadata?.LicenseShortName?.value) || "see file page" };
      }
    }
    console.info("[2Kdle photo] no Wikidata match with a photo for", p.name, tries);
    return null;
  })().catch(err => { console.warn("[2Kdle photo] lookup failed for", p.name, err); return null; });
  PHOTO_CACHE.set(p.i, job);
  return job;
}
function showPhoto(t) {
  const fig = document.getElementById("endphoto"); if (!fig) return;
  const target = S.target;
  findPhoto(t).then(ph => {
    if (!ph || S.target !== target || !document.body.contains(fig)) return;
    const img = new Image();
    img.alt = t.name; img.referrerPolicy = "no-referrer";
    img.onerror = () => console.warn("[2Kdle photo] image failed to load", ph.src);
    img.onload = () => {
      fig.innerHTML = "";
      fig.append(img);
      const cap = document.createElement("figcaption");
      const a = document.createElement("a"); a.href = ph.page; a.target = "_blank"; a.rel = "noopener";
      a.textContent = `Photo: ${ph.artist} · ${ph.license}`;
      cap.append(a); fig.append(cap); fig.hidden = false;
    };
    img.src = ph.src;
  });
}

function shareText() {
  const t = P[S.target], { won, forfeit } = status();
  const sq = st => st === "hit" ? "🟩" : st === "near" ? "🟨" : "⬛";
  const hm = document.getElementById("hard").checked ? "*" : "";
  const head = (S.mode === "daily" ? `2Kdle #${dayNumber()} ` : `2Kdle · Unlimited `) + `${won ? S.guesses.length : "X"}/${MAX}${hm}${forfeit ? " (forfeit)" : ""}`;
  return head + "\n" + S.guesses.map(gi => { const c = compare(P[gi], t); return ["ovr", "pos", "ht", "team", "nation", ...STATS].map(k => sq(c[k].st)).join(""); }).join("\n");
}
function recordResult() {
  const key = S.mode === "daily" ? "2kdle-stats-daily" : "2kdle-stats-free";
  const st = store.get(key, { played: 0, wins: 0, streak: 0, best: 0, last: null });
  const id = S.mode === "daily" ? S.date : null;
  if (id && st.last === id) return st;
  const { won } = status();
  st.played++; if (won) { st.wins++; st.streak++; st.best = Math.max(st.best, st.streak); } else st.streak = 0;
  st.last = id; store.set(key, st); return st;
}
function renderEnd(justFinished) {
  const end = document.getElementById("end"), { won, over, forfeit } = status();
  if (!over) { end.hidden = true; return; }
  const st = justFinished ? recordResult() : store.get(S.mode === "daily" ? "2kdle-stats-daily" : "2kdle-stats-free", { played: 0, wins: 0, streak: 0, best: 0 });
  const t = P[S.target];
  end.classList.toggle("lost", !won);
  const sub = won ? (S.guesses.length === 1 ? "First try. Nothing but net." : `Got it in ${S.guesses.length} of ${MAX} guesses.`)
    : forfeit ? `You forfeited after ${S.guesses.length} ${S.guesses.length === 1 ? "guess" : "guesses"}.` : `All ${MAX} guesses used.`;
  end.innerHTML = `<figure class="photo" id="endphoto" hidden></figure><div class="endtext"><h2 class="${won ? "win" : "loss"}">${won ? "Victory!" : "Defeat"}</h2><p class="sub">${sub}</p>
    <p>The player was <b>${esc(t.name)}</b>, ${t.ovr} OVR ${t.pos}, ${esc(TEAMS[t.team])} (${esc(t.nation)}).</p>
    <div class="stats"><span><b>${st.played}</b>Played</span><span><b>${st.played ? Math.round(st.wins / st.played * 100) : 0}%</b>Won</span><span><b>${st.streak}</b>Streak</span><span><b>${st.best}</b>Best</span></div>
    <pre class="share" id="sharetxt">${shareText()}</pre>
    <div class="row"><button class="btn primary" id="copy">Copy result</button>${S.mode === "daily" ? `<button class="btn" id="tofree">Play unlimited</button>` : `<button class="btn" id="again">New player</button>`}</div></div>`;
  end.hidden = false;
  showPhoto(t);
  document.getElementById("copy").onclick = async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(shareText()); b.textContent = "Copied"; }
    catch (err) { const r = document.createRange(); r.selectNodeContents(document.getElementById("sharetxt")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected. Copy it with your keyboard"; }
  };
  const tf = document.getElementById("tofree"); if (tf) tf.onclick = () => setMode("free");
  const ag = document.getElementById("again"); if (ag) ag.onclick = () => start("free");
}
function renderCount() {
  const { over } = status(), q = document.getElementById("q");
  document.getElementById("ff").hidden = over;
  document.getElementById("ff-ask").hidden = false; document.getElementById("ff-confirm").hidden = true;
  document.getElementById("count").innerHTML = over ? `<b>${S.guesses.length}</b>/${MAX} used` : `Guess <b>${S.guesses.length + 1}</b>/${MAX}`;
  q.disabled = over; q.placeholder = over ? (S.mode === "daily" ? "Come back tomorrow for a new player" : "Hit New player to play again") : "Type a player… e.g. Stephen Curry";
}
function render(fresh, justFinished) { renderCard(); renderRows(fresh); renderCount(); renderEnd(justFinished); }

function guess(i) {
  if (status().over || S.guesses.includes(i)) return;
  S.guesses.push(i); save();
  render(S.guesses.length - 1, status().over);
}

// Autocomplete
const q = document.getElementById("q"), sug = document.getElementById("sug");
let matches = [], sel = 0;
function search(text) {
  const f = fold(text.trim()).replace(/["'.]/g, ""); if (!f) return [];
  const taken = new Set(S.guesses), words = f.split(/\s+/);
  const hard = document.getElementById("hard").checked;
  const res = [];
  for (const p of P) {
    if (taken.has(p.i)) continue;
    // Name words match anywhere in the name; team and nation only match from the start of a word.
    if (words.every(w => p.names.includes(w) || (!hard && p.extra.some(x => x.startsWith(w))))) res.push(p);
  }
  const starts = p => p.names.startsWith(f) ? 3 : p.names.split(/[\s-]/).some(w => w.startsWith(words[0])) ? 2 : p.names.includes(words[0]) ? 1 : 0;
  res.sort((a, b) => (starts(b) - starts(a)) || b.ovr - a.ovr);
  return res.slice(0, 8);
}
function drawList() {
  if (!matches.length) { sug.hidden = true; q.setAttribute("aria-expanded", "false"); return; }
  const hard = document.getElementById("hard").checked;
  sug.classList.toggle("bare", hard);
  sug.innerHTML = matches.map((p, n) => `<li role="option" id="opt${n}" aria-selected="${n === sel}" data-i="${p.i}">${hard ? "" : `<span class="o">${p.ovr}</span>`}<span class="n">${hard ? "" : `<span class="f" aria-hidden="true">${FLAG[p.nation] || ""}</span>`}${esc(p.name)}</span>${hard ? "" : `<span class="badge ${GROUP[p.pos]}" title="${GROUP_NAME[GROUP[p.pos]]}">${GROUP[p.pos]}</span><span class="s">${p.pos} · ${esc(TEAMS[p.team])}</span>`}</li>`).join("");
  sug.hidden = false; q.setAttribute("aria-expanded", "true"); q.setAttribute("aria-activedescendant", "opt" + sel);
}
q.addEventListener("input", () => { matches = search(q.value); sel = 0; drawList(); });
q.addEventListener("keydown", e => {
  if (sug.hidden) return;
  if (e.key === "ArrowDown") { sel = (sel + 1) % matches.length; drawList(); e.preventDefault(); }
  else if (e.key === "ArrowUp") { sel = (sel - 1 + matches.length) % matches.length; drawList(); e.preventDefault(); }
  else if (e.key === "Enter") { pick(matches[sel]); e.preventDefault(); }
  else if (e.key === "Escape") { matches = []; drawList(); }
});
sug.addEventListener("mousedown", e => { const li = e.target.closest("li"); if (li) { e.preventDefault(); pick(P[+li.dataset.i]); } });
q.addEventListener("blur", () => setTimeout(() => { sug.hidden = true; }, 120));
function pick(p) { if (!p) return; q.value = ""; matches = []; drawList(); guess(p.i); q.focus(); }

// Modes
function setMode(mode) {
  document.getElementById("m-daily").setAttribute("aria-pressed", mode === "daily");
  document.getElementById("m-free").setAttribute("aria-pressed", mode === "free");
  document.getElementById("diff").hidden = mode === "daily";
  document.getElementById("newgame").hidden = mode === "daily";
  start(mode);
}
document.getElementById("ff-ask").onclick = () => { document.getElementById("ff-ask").hidden = true; document.getElementById("ff-confirm").hidden = false; document.getElementById("ff-no").focus(); };
document.getElementById("ff-no").onclick = () => { document.getElementById("ff-ask").hidden = false; document.getElementById("ff-confirm").hidden = true; };
document.getElementById("ff-yes").onclick = () => { if (status().over) return; S.forfeit = true; save(); render(null, true); };
function start(mode) { S = newState(mode); q.value = ""; matches = []; drawList(); render(null, false); }
document.getElementById("m-daily").onclick = () => setMode("daily");
document.getElementById("m-free").onclick = () => setMode("free");
document.getElementById("newgame").onclick = () => start("free");
document.getElementById("diff").onchange = () => start("free");
const hardBox = document.getElementById("hard");
hardBox.checked = store.get("2kdle-hard", false);
hardBox.onchange = () => { store.set("2kdle-hard", hardBox.checked); if (!sug.hidden) drawList(); q.focus(); };
setMode("daily");
