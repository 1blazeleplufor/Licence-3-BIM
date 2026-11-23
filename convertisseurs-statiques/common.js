/* Outils partagés : formatage, oscilloscope, symboles, animation, navigation */
const TD = (() => {
const C = { blue:'#2f6fd6', green:'#1d9a52', red:'#d43f3f', orange:'#df8516', violet:'#7a4cc2', teal:'#138a8a', ink:'#1c2230', muted:'#5c6577', grid:'#eceef2', axis:'#9aa3b2', off:'#b9bfca' };
const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const fmt = (x, d = 2) => (Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x).toFixed(d).replace('.', ',').replace('-', '−');
const TWO_PI = Math.PI * 2;

/* ---------- Oscilloscope multi-voies ----------
 cfg = { h, span, ticks:[[t,label]], cursor, panels:[{ w, min, max, yticks, label, traces:[{f,c,w,dash,label}], shade:[[t0,t1,color]] }] } */
function scope(cv, cfg) {
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = cfg.h || 320;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px'; }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const l = 50, r = 12, top = 6, bot = 24, gap = 12;
  const totW = cfg.panels.reduce((s, p) => s + (p.w || 1), 0), avail = H - top - bot - gap * (cfg.panels.length - 1);
  const X = t => l + t / cfg.span * (W - l - r);
  const N = cfg.N || 700;
  let y0 = top;
  ctx.font = '11px system-ui';
  for (const p of cfg.panels) {
    const ph = avail * (p.w || 1) / totW, Y = v => y0 + (p.max - v) / (p.max - p.min) * ph;
    ctx.fillStyle = '#fff'; ctx.fillRect(l, y0, W - l - r, ph);
    for (const [a, b, col] of (p.shade || [])) { ctx.fillStyle = col || '#d6f2e2'; ctx.fillRect(X(a), y0, X(b) - X(a), ph); }
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.fillStyle = C.muted; ctx.textAlign = 'right';
    for (const v of (p.yticks || [])) { ctx.beginPath(); ctx.moveTo(l, Y(v)); ctx.lineTo(W - r, Y(v)); ctx.stroke(); ctx.fillText(typeof v === 'number' ? fmt(v, Math.abs(v) < 10 && v % 1 ? 1 : 0) : v, l - 5, Y(v) + 4); }
    for (const [t] of cfg.ticks) { ctx.beginPath(); ctx.moveTo(X(t), y0); ctx.lineTo(X(t), y0 + ph); ctx.stroke(); }
    if (p.min < 0 && p.max > 0) { ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(l, Y(0)); ctx.lineTo(W - r, Y(0)); ctx.stroke(); }
    ctx.strokeStyle = '#d0d4dc'; ctx.strokeRect(l + .5, y0 + .5, W - l - r - 1, ph - 1);
    // traces : fantôme puis tracé jusqu'au curseur
    ctx.save(); ctx.beginPath(); ctx.rect(l, y0, W - l - r, ph); ctx.clip();
    for (const pass of [0, 1]) for (const tr of p.traces) {
      const end = pass ? cfg.cursor : cfg.span; if (end <= 0) continue;
      ctx.strokeStyle = tr.c; ctx.lineWidth = tr.w || 2; ctx.globalAlpha = pass ? 1 : 0.16; ctx.setLineDash(tr.dash || []);
      ctx.beginPath(); const n = Math.max(2, Math.ceil(end / cfg.span * N));
      for (let k = 0; k <= n; k++) { const t = k / n * end, x = X(t), y = Y(tr.f(t)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1; ctx.restore();
    if (p.label) { ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.font = '600 11px system-ui'; ctx.fillText(p.label, l + 6, y0 + 13); ctx.font = '11px system-ui'; }
    // curseur
    const xc = X(cfg.cursor); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xc, y0); ctx.lineTo(xc, y0 + ph); ctx.stroke(); ctx.setLineDash([]);
    for (const tr of p.traces) if (!tr.nodot) { const v = tr.f(cfg.cursor); if (v >= p.min && v <= p.max) { ctx.fillStyle = tr.c; ctx.beginPath(); ctx.arc(xc, Y(v), 4, 0, TWO_PI); ctx.fill(); } }
    y0 += ph + gap;
  }
  ctx.fillStyle = C.muted; ctx.textAlign = 'center';
  for (const [t, lab] of cfg.ticks) ctx.fillText(lab, X(t), H - 7);
}

/* ---------- Diagramme en barres (spectre) ---------- */
function bars(cv, cfg) {
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = cfg.h || 170;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px'; }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const l = 50, r = 12, top = 22, bot = 26, pw = W - l - r, ph = H - top - bot, n = cfg.values.length, bw = pw / n;
  ctx.font = '11px system-ui'; ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.font = '600 11px system-ui'; ctx.fillText(cfg.title, l, 13); ctx.font = '11px system-ui';
  ctx.strokeStyle = C.grid; ctx.textAlign = 'right';
  for (const v of cfg.yticks) { const y = top + ph - v / cfg.max * ph; ctx.beginPath(); ctx.moveTo(l, y); ctx.lineTo(W - r, y); ctx.stroke(); ctx.fillText(fmt(v, 0) + (cfg.unit || ''), l - 5, y + 4); }
  cfg.values.forEach((v, k) => {
    const h = Math.min(1, v / cfg.max) * ph, x = l + k * bw;
    ctx.fillStyle = k === 0 ? C.green : C.orange; ctx.fillRect(x + bw * 0.18, top + ph - h, bw * 0.64, h);
    if (cfg.labelEvery && (k + 1) % cfg.labelEvery === 0 || k === 0) { ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.fillText(String(k + 1), x + bw / 2, H - 9); }
  });
  ctx.textAlign = 'right'; ctx.fillStyle = C.muted; ctx.fillText(cfg.xlabel || 'rang', W - r, H - 9);
}

/* ---------- Petits symboles SVG ---------- */
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function txt(parent, x, y, s, o = {}) { const t = el('text', Object.assign({ x, y, 'font-size': 13, fill: C.ink, 'text-anchor': 'middle' }, o), parent); t.innerHTML = s; return t; }
/* diode ou thyristor vertical, anode en bas, cathode en haut (dir = 'up') ou l'inverse */
function vdevice(parent, x, cy, label, kind = 'diode', dir = 'up', labelSide = 'left') {
  const g = el('g', {}, parent), s = dir === 'up' ? 1 : -1;
  const tri = el('polygon', { points: `${x - 12},${cy + 10 * s} ${x + 12},${cy + 10 * s} ${x},${cy - 10 * s}`, 'stroke-width': 2, fill: '#fff', stroke: C.ink }, g);
  const bar = el('line', { x1: x - 13, y1: cy - 10 * s, x2: x + 13, y2: cy - 10 * s, 'stroke-width': 3, stroke: C.ink }, g);
  let gate = null;
  if (kind === 'thyr') gate = el('path', { d: `M${x + 6} ${cy - 4 * s} L${x + 20} ${cy - 16 * s}`, 'stroke-width': 2, stroke: C.violet, fill: 'none' }, g);
  const lx = labelSide === 'left' ? x - 20 : x + 20;
  txt(g, lx, cy + 5, label, { 'text-anchor': labelSide === 'left' ? 'end' : 'start', 'font-weight': 600, 'font-size': 13.5 });
  return { g, tri, bar, gate, set(state) { // state: 'on' | 'off' | 'idle'
    const col = state === 'on' ? C.green : state === 'off' ? C.red : C.ink;
    tri.setAttribute('stroke', col); bar.setAttribute('stroke', col); tri.setAttribute('fill', state === 'on' ? '#d6f2e2' : state === 'off' ? '#fbe6e6' : '#fff'); } };
}
function resistor(parent, x, y0, y1, label) {
  const cy = (y0 + y1) / 2, g = el('g', {}, parent);
  el('rect', { x: x - 12, y: cy - 38, width: 24, height: 76, rx: 3, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, g);
  if (label) txt(g, x + 20, cy + 5, label, { 'text-anchor': 'start', 'font-size': 13, fill: C.muted });
  return g;
}
function acSource(parent, x, y, label) {
  const g = el('g', {}, parent);
  el('circle', { cx: x, cy: y, r: 22, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, g);
  el('path', { d: `M${x - 13} ${y} q6.5 -12 13 0 t13 0`, fill: 'none', stroke: C.ink, 'stroke-width': 2 }, g);
  if (label) txt(g, x, y - 30, label, { fill: C.blue, 'font-weight': 600 });
  return g;
}

/* ---------- Boucle d'animation ---------- */
const sims = {};
let active = null, last = null;
function register(id, sim) { sims[id] = sim; }
function loop(ts) {
  const dt = last === null ? 0 : Math.min(0.05, (ts - last) / 1000); last = ts;
  const s = sims[active]; if (s) s.tick(dt);
  requestAnimationFrame(loop);
}
/* commande standard : lecture, vitesse, curseur de temps */
function transport(prefix, sim) {
  const play = $(prefix + '-play'), scrub = $(prefix + '-scrub');
  sim.playing = true; sim.speed = 1; sim.t = sim.t || 0;
  const setP = p => { sim.playing = p; play.textContent = p ? '⏸ Pause' : '▶ Lecture'; };
  sim.setPlaying = setP;
  play.onclick = () => setP(!sim.playing);
  scrub.addEventListener('input', () => { setP(false); sim.t = scrub.value / 1000 * sim.span(); sim.draw(); });
  seg(prefix + '-speed', v => sim.speed = parseFloat(v));
  sim.tick = dt => {
    if (sim.playing) { sim.t = (sim.t + dt * sim.speed * sim.span() / sim.dur) % sim.span(); scrub.value = Math.round(sim.t / sim.span() * 1000); }
    sim.draw(dt);
  };
}
function seg(id, cb) { const g = $(id); if (!g) return; g.querySelectorAll('button').forEach(b => b.onclick = () => { g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); }); }
function slider(id, cb, show) { const s = $(id), o = $(id + '-o'); const f = () => { const v = parseFloat(s.value); if (o) o.textContent = show ? show(v) : v; cb(v); }; s.addEventListener('input', f); f(); }

/* ---------- Navigation par onglets ---------- */
function route() {
  const id = (location.hash || '#accueil').slice(1);
  const target = document.querySelector('.fiche#' + CSS.escape(id)) ? id : 'accueil';
  document.querySelectorAll('.fiche').forEach(f => f.classList.toggle('on', f.id === target));
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + target));
  active = target; window.scrollTo(0, 0);
  const s = sims[active]; if (s) s.draw(0);
}
window.addEventListener('hashchange', route);
window.addEventListener('resize', () => { const s = sims[active]; if (s) s.draw(0); });
document.addEventListener('DOMContentLoaded', () => {
  route(); requestAnimationFrame(loop);
  const cb = $('showcorr');
  cb.addEventListener('change', () => document.querySelectorAll('details.corr').forEach(d => d.open = cb.checked));
});
return { C, NS, $, fmt, TWO_PI, scope, bars, el, txt, vdevice, resistor, acSource, register, transport, seg, slider };
})();
