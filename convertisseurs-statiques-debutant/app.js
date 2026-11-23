'use strict';
/* Cours « Convertisseurs statiques » version débutant : animations + QCM */
const C = { blue:'#2f6fd6', green:'#1d9a52', red:'#d43f3f', orange:'#df8516', violet:'#7a4cc2', teal:'#138a8a', ink:'#1c2230', muted:'#5c6577', grid:'#eceef2', axis:'#9aa3b2' };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (x, d = 0) => (Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x).toFixed(d).replace('.', ',').replace('-', '−');
const D2R = Math.PI / 180, VMAX = 325;                 // 230 V efficaces = 325 V crête
const vAt = th => VMAX * Math.sin(th * D2R);
const acTicks = [0, 180, 360, 540, 720].map(t => [t, `${t}°\n${t / 18} ms`]);

/* ============ Outils de dessin ============ */
function prep(cv, lw, lh) {
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || lw, H = W * lh / lw;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  cv.style.height = H + 'px';
  const ctx = cv.getContext('2d'), k = W / lw * dpr;
  ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, lw, lh);
  return ctx;
}
function text(ctx, s, x, y, o = {}) {
  ctx.font = `${o.bold ? '700 ' : ''}${o.size || 13}px system-ui`; ctx.fillStyle = o.color || C.ink;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
function wire(ctx, pts, col = C.ink, w = 2) {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
}
function dot(ctx, x, y) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); }
function dots(ctx, pts, off, col) {
  const seg = []; let L = 0;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l, L]); L += l; }
  ctx.fillStyle = col || C.green;
  for (let s = ((off % 34) + 34) % 34; s < L; s += 34) {
    const g = seg.find(g => s <= g[3] + g[2]) || seg[seg.length - 1], u = g[2] ? (s - g[3]) / g[2] : 0;
    ctx.beginPath(); ctx.arc(g[0][0] + (g[1][0] - g[0][0]) * u, g[0][1] + (g[1][1] - g[0][1]) * u, 3.8, 0, 7); ctx.fill();
  }
}
/* diode (gate=false) ou thyristor (gate=true). deg : 0 = passant vers la droite, -90 = vers le haut, 180 = vers la gauche */
function diodeSym(ctx, x, y, deg, state, name, o = {}) {
  const col = state === 'on' ? C.green : state === 'off' ? C.red : C.ink, fill = state === 'on' ? '#d6f2e2' : state === 'off' ? '#fbe6e6' : '#fff';
  const r = deg * D2R, ux = Math.cos(r), uy = Math.sin(r), px = -uy, py = ux;
  ctx.save(); ctx.translate(x, y); ctx.rotate(r);
  ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(-10, 12); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(10, -13); ctx.lineTo(10, 13); ctx.stroke();
  if (o.gate) { ctx.lineWidth = o.pulse ? 5 : 2; ctx.strokeStyle = o.pulse ? C.orange : C.violet; ctx.beginPath(); ctx.moveTo(4, 5); ctx.lineTo(14, 19); ctx.stroke(); }
  ctx.restore();
  if (name) text(ctx, name, x - px * 27, y - py * 27, { bold: true, size: 14 });
  if (o.ak) { text(ctx, 'A', x - ux * 30 + px * 14, y - uy * 30 + py * 14, { size: 12, color: C.blue, bold: true }); text(ctx, 'K', x + ux * 30 + px * 14, y + uy * 30 + py * 14, { size: 12, color: C.blue, bold: true }); }
  if (o.gate) text(ctx, 'G', x + (16 * ux - 25 * uy), y + (16 * uy + 25 * ux), { size: 12, color: o.pulse ? C.orange : C.violet, bold: true });
}
function acSource(ctx, x, y) {
  ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.bezierCurveTo(x - 8, y - 15, x - 3, y - 15, x, y); ctx.bezierCurveTo(x + 3, y + 15, x + 8, y + 15, x + 13, y); ctx.stroke(); ctx.restore();
}
function lamp(ctx, x, y, level) {
  if (level > 0) { const g = ctx.createRadialGradient(x, y, 6, x, y, 54); g.addColorStop(0, `rgba(255,205,40,${0.8 * level})`); g.addColorStop(1, 'rgba(255,205,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 54, 0, 7); ctx.fill(); }
  ctx.fillStyle = `rgba(255,221,87,${0.1 + 0.9 * level})`; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 15.5, y - 15.5); ctx.lineTo(x + 15.5, y + 15.5); ctx.moveTo(x + 15.5, y - 15.5); ctx.lineTo(x - 15.5, y + 15.5); ctx.stroke();
  text(ctx, 'lampe', x - 30, y, { align: 'right', size: 12, color: C.muted });
}
function battery(ctx, x, y) {
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 16, y - 5); ctx.lineTo(x + 16, y - 5); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 9, y + 6); ctx.lineTo(x + 9, y + 6); ctx.stroke();
  text(ctx, '+', x - 27, y - 11, { bold: true, color: C.muted }); text(ctx, '−', x - 27, y + 14, { bold: true, color: C.muted });
}
function box(ctx, x, y, w, h, label) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  if (label) text(ctx, label, x, y, { size: 12.5 });
}
function coil(ctx, x0, y, n) {
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0, y);
  for (let k = 0; k < n; k++) ctx.arc(x0 + 8 + 16 * k, y, 8, Math.PI, 0);
  ctx.stroke();
}
function switchH(ctx, x, y, closed, name) {
  wire(ctx, closed ? [[x - 26, y], [x + 26, y]] : [[x - 26, y], [x + 18, y - 22]], closed ? C.green : C.red, 3.2);
  dot(ctx, x - 26, y); dot(ctx, x + 26, y);
  text(ctx, name, x, y - 30, { bold: true, size: 14, color: C.violet });
}
function switchV(ctx, x, y, closed, name) {
  wire(ctx, closed ? [[x, y + 22], [x, y - 22]] : [[x, y + 22], [x - 18, y - 8]], closed ? C.green : '#aab1bf', 3.2);
  dot(ctx, x, y - 22); dot(ctx, x, y + 22);
  text(ctx, name, x + (x < 250 ? -30 : 30), y, { bold: true, size: 14, color: closed ? C.green : C.muted });
}
const vals = arr => arr.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');

/* ============ Oscilloscope (courbes) ============ */
function plot(cv, cfg) {
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 700, H = cfg.h;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  cv.style.height = H + 'px';
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.textBaseline = 'alphabetic';
  const l = 52, r = 12, top = 6, bot = 36, gap = 12, N = cfg.N || 720;
  const totW = cfg.panels.reduce((s, p) => s + (p.w || 1), 0), avail = H - top - bot - gap * (cfg.panels.length - 1);
  const X = t => l + t / cfg.span * (W - l - r);
  let y0 = top; ctx.font = '11px system-ui';
  for (const p of cfg.panels) {
    const ph = avail * (p.w || 1) / totW, Y = v => y0 + (p.max - v) / (p.max - p.min) * ph;
    ctx.fillStyle = '#fff'; ctx.fillRect(l, y0, W - l - r, ph);
    for (const [a, b, col] of (p.shade || [])) { ctx.fillStyle = col || '#d6f2e2'; ctx.fillRect(X(a), y0, X(b) - X(a), ph); }
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.fillStyle = C.muted; ctx.textAlign = 'right';
    for (const v of (p.yticks || [])) { ctx.beginPath(); ctx.moveTo(l, Y(v)); ctx.lineTo(W - r, Y(v)); ctx.stroke(); ctx.fillText(fmt(v, 0), l - 5, Y(v) + 4); }
    for (const [t] of cfg.ticks) { ctx.beginPath(); ctx.moveTo(X(t), y0); ctx.lineTo(X(t), y0 + ph); ctx.stroke(); }
    if (p.min < 0 && p.max > 0) { ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(l, Y(0)); ctx.lineTo(W - r, Y(0)); ctx.stroke(); }
    ctx.strokeStyle = '#d0d4dc'; ctx.strokeRect(l + .5, y0 + .5, W - l - r - 1, ph - 1);
    ctx.save(); ctx.beginPath(); ctx.rect(l, y0, W - l - r, ph); ctx.clip();
    for (const pass of [0, 1]) for (const tr of p.traces) {
      const end = pass ? cfg.cursor : cfg.span; if (end <= 0) continue;
      if (!pass && tr.noghost) continue;
      ctx.strokeStyle = tr.c; ctx.lineWidth = tr.w || 2; ctx.globalAlpha = pass ? 1 : 0.16; ctx.setLineDash(tr.dash || []);
      ctx.beginPath(); const n = Math.max(2, Math.ceil(end / cfg.span * N));
      for (let k = 0; k <= n; k++) { const t = k / n * end, x = X(t), y = Y(tr.f(t)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1; ctx.restore();
    if (p.label) { ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.font = '600 11px system-ui'; ctx.fillText(p.label, l + 6, y0 + 13); ctx.font = '11px system-ui'; }
    const xc = X(cfg.cursor); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xc, y0); ctx.lineTo(xc, y0 + ph); ctx.stroke(); ctx.setLineDash([]);
    for (const tr of p.traces) if (!tr.nodot) { const v = tr.f(cfg.cursor); if (v >= p.min && v <= p.max) { ctx.fillStyle = tr.c; ctx.beginPath(); ctx.arc(xc, Y(v), 4, 0, 7); ctx.fill(); } }
    y0 += ph + gap;
  }
  ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.font = '11px system-ui';
  for (const [t, lab] of cfg.ticks) lab.split('\n').forEach((ln, k) => ctx.fillText(ln, X(t), H - bot + 16 + 13 * k));
}
/* zones colorées : intervalles où test(t) est vrai */
function zones(test, span, col, n = 1440) {
  const out = []; let s0 = null;
  for (let k = 0; k <= n; k++) { const t = k / n * span, on = k < n && test(t); if (on && s0 === null) s0 = t; if (!on && s0 !== null) { out.push([s0, t, col || '#d6f2e2']); s0 = null; } }
  return out;
}

/* ============ Gestionnaire d'animations ============ */
const all = [];
function seg(g, cb) { g.querySelectorAll('button').forEach(b => b.onclick = () => { g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset.v); }); }
class Sim {
  constructor(id, o) {
    this.id = id; this.o = o; this.t = 0; this.playing = true; this.speed = 1; this.vis = false; this.off = 0;
    const host = this.host = document.querySelector(`[data-sim="${id}"]`); if (!host) return;
    host.innerHTML = `<div class="anim">
      <div class="controls"><button type="button" class="play">⏸ Pause</button>
        <div class="seg speed"><button type="button" data-v="0.5">×0,5</button><button type="button" data-v="1" class="on">×1</button><button type="button" data-v="2">×2</button></div>
        <label class="ctl">Temps <input type="range" class="scrub" min="0" max="1000" value="0"></label>
        ${o.controls || ''}</div>
      <div class="stage"><div><canvas class="sch"></canvas></div>
        <div class="live"><div class="badge">&nbsp;</div><div class="vals"></div><div class="msg"></div></div></div>
      <canvas class="plot"></canvas><div class="legend">${o.legend || ''}</div></div>`;
    this.q = s => host.querySelector(s);
    this.sch = this.q('.sch'); this.plt = this.q('.plot'); this.badge = this.q('.badge'); this.msg = this.q('.msg'); this.valsEl = this.q('.vals'); this.scrub = this.q('.scrub'); this.play = this.q('.play');
    this.play.onclick = () => { this.playing = !this.playing; this.play.textContent = this.playing ? '⏸ Pause' : '▶ Lecture'; };
    this.scrub.addEventListener('input', () => { this.playing = false; this.play.textContent = '▶ Lecture'; this.t = this.scrub.value / 1000 * this.span(); this.render(0); });
    seg(this.q('.speed'), v => this.speed = parseFloat(v));
    if (o.init) o.init(this);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { this.vis = es[0].isIntersecting; if (this.vis) this.render(0); }).observe(host); else this.vis = true;
    all.push(this); this.render(0);
  }
  span() { return this.o.span(this); }
  step(dt) {
    if (this.playing) { this.t = (this.t + dt * this.speed * this.span() / this.o.dur) % this.span(); this.scrub.value = Math.round(this.t / this.span() * 1000); }
    this.render(this.playing ? dt * this.speed : 0);
  }
  render(dt) { this.t = Math.min(this.t, this.span()); this.o.draw(this, dt); }
  show(badge, color, vs, msg) { this.badge.textContent = badge; this.badge.style.background = color; this.valsEl.innerHTML = vals(vs); this.msg.innerHTML = msg; }
}
let lastTs = null;
function loop(ts) { const dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts; for (const s of all) if (s.vis) s.step(dt); requestAnimationFrame(loop); }
window.addEventListener('resize', () => all.forEach(s => s.vis && s.render(0)));
const halfPower = a => 1 - a / Math.PI + Math.sin(2 * a) / (2 * Math.PI);   // P / Pmax pour un retard d'amorçage a (rad)

/* ============ 1. Diode seule ============ */
new Sim('diode', {
  span: () => 720, dur: 10,
  controls: `<div class="seg" id="diode-mode"><button type="button" data-v="none">Sans diode</button><button type="button" data-v="diode" class="on">Avec une diode</button><button type="button" data-v="rev">Diode retournée</button></div>`,
  legend: '<span><i style="background:#2f6fd6"></i>tension de la prise v</span><span><i style="background:#1d9a52"></i>tension reçue par la lampe u</span><span><i style="background:#7a4cc2"></i>courant i</span><span><i class="z"></i>la diode laisse passer</span>',
  init(s) { s.mode = 'diode'; seg(s.q('#diode-mode'), v => { s.mode = v; s.render(0); }); },
  draw(s, dt) {
    const m = s.mode, cond = th => m === 'none' || (m === 'diode' && vAt(th) > 0) || (m === 'rev' && vAt(th) < 0);
    const v = vAt(s.t), on = cond(s.t), u = on ? v : 0, i = u / 100, level = m === 'none' ? 1 : 0.5;
    const ctx = prep(s.sch, 460, 290);
    lamp(ctx, 400, 150, level);
    wire(ctx, [[70, 128], [70, 60], [m === 'none' ? 400 : 188, 60]]);
    if (m !== 'none') wire(ctx, [[212, 60], [400, 60]]);
    wire(ctx, [[400, 60], [400, 128]]); wire(ctx, [[400, 172], [400, 250], [70, 250], [70, 172]]);
    acSource(ctx, 70, 150);
    text(ctx, 'v', 36, 150, { color: C.blue, bold: true, size: 16 }); text(ctx, '+', 96, 118, { color: C.muted, bold: true }); text(ctx, '−', 96, 184, { color: C.muted, bold: true });
    text(ctx, 'prise 230 V', 70, 282, { size: 12, color: C.muted });
    if (m !== 'none') diodeSym(ctx, 200, 60, m === 'diode' ? 0 : 180, on ? 'on' : 'off', 'D', { ak: true });
    const P = [[70, 128], [70, 60], [400, 60], [400, 250], [70, 250], [70, 172]];
    if (on && Math.abs(v) > 8) { s.off += dt * 110 * (0.25 + 0.75 * Math.abs(v) / VMAX); dots(ctx, v > 0 ? P : P.slice().reverse(), s.off); }
    let b, col, msg;
    if (m === 'none') { b = 'Pas de diode : le courant va et vient'; col = C.ink; msg = 'Sans diode, la lampe reçoit l’alternatif tel quel : le courant change de sens à chaque demi-période. Remarque les points verts : ils changent de direction.'; }
    else if (on) { b = 'La diode laisse passer'; col = C.green; msg = m === 'diode' ? 'Le côté <b>A</b> (anode) est plus « haut » que le côté <b>K</b> (cathode) : la diode se comporte comme un fil. La lampe reçoit toute la tension.' : 'La diode est retournée : maintenant c’est <b>pendant la demi-période négative</b> que A est plus haut que K. La lampe ne reçoit que les alternances négatives.'; }
    else { b = 'La diode bloque'; col = C.red; msg = m === 'diode' ? 'Le côté <b>K</b> est plus « haut » que le côté <b>A</b> : la diode se comporte comme un interrupteur ouvert. Aucun courant, la lampe ne reçoit rien.' : 'Pendant la demi-période positive, la diode retournée a son côté K plus haut que A : elle bloque.'; }
    s.show(b, col, [['tension prise v', fmt(v) + ' V'], ['tension lampe u', fmt(u) + ' V'], ['courant i', fmt(i, 2) + ' A'], ['énergie reçue par la lampe', fmt(level * 100) + ' %']], msg);
    plot(s.plt, { h: 340, span: 720, cursor: s.t, ticks: acTicks, panels: [
      { w: 1.5, min: -360, max: 360, yticks: [-300, 0, 300], label: 'tensions (V)', shade: m === 'none' ? [] : zones(cond, 720), traces: [{ f: vAt, c: C.blue, w: 1.6 }, { f: t => cond(t) ? vAt(t) : 0, c: C.green, w: 3.5 }] },
      { w: 0.9, min: -4, max: 4, yticks: [-3, 0, 3], label: 'courant i (A)', shade: m === 'none' ? [] : zones(cond, 720), traces: [{ f: t => cond(t) ? vAt(t) / 100 : 0, c: C.violet, w: 2.5 }] }] });
  }
});

/* ============ 2 et 5. Pont monophasé : diodes (pd2) ou 2 thyristors (pcom) ============ */
function bridgeSim(id, ctrl) {
  new Sim(id, {
    span: () => 720, dur: 10,
    controls: ctrl ? `<label class="ctl">Retard α <input type="range" id="${id}-a" min="0" max="170" step="5" value="60"><output id="${id}-a-o">60°</output></label>` : '',
    legend: '<span><i style="background:#2f6fd6"></i>tension de la prise v</span><span><i style="background:#1d9a52"></i>tension reçue par la lampe u</span>' + (ctrl ? '<span><i style="background:#7a4cc2"></i>impulsion sur T1</span><span><i style="background:#df8516"></i>impulsion sur T2</span>' : '') + `<span><i class="z"></i>${ctrl ? 'T1' : 'D1'} conduit</span>`,
    init(s) { s.a = ctrl ? 60 : 0; if (ctrl) { const r = s.q('#' + id + '-a'), o = s.q('#' + id + '-a-o'); r.oninput = () => { s.a = +r.value; o.textContent = s.a + '°'; s.render(0); }; } },
    draw(s, dt) {
      const a = s.a;
      const st = th => { const pm = ((th % 360) + 360) % 360, v = vAt(th); let top = null, bot = null, u = 0;
        if (pm < 180) { if (pm >= a) { top = 0; bot = 1; u = v; } } else if (pm - 180 >= a) { top = 1; bot = 0; u = -v; }
        return { v, u, top, bot, on: top !== null, pm }; };
      const x = st(s.t), xs = [130, 250], tn = ctrl ? ['T1', 'T2'] : ['D1', 'D2'], bn = ['D3', 'D4'];
      const level = halfPower(a * D2R), mean = VMAX * (1 + Math.cos(a * D2R)) / Math.PI;
      const ctx = prep(s.sch, 460, 290);
      lamp(ctx, 400, 150, level);
      wire(ctx, [[130, 50], [400, 50], [400, 128]]); wire(ctx, [[400, 172], [400, 250], [130, 250]]);
      xs.forEach(px => { wire(ctx, [[px, 50], [px, 88]]); wire(ctx, [[px, 112], [px, 188]]); wire(ctx, [[px, 212], [px, 250]]); dot(ctx, px, 50); dot(ctx, px, 150); dot(ctx, px, 250); });
      wire(ctx, [[130, 150], [168, 150]]); wire(ctx, [[212, 150], [250, 150]]); acSource(ctx, 190, 150);
      text(ctx, 'v', 190, 114, { color: C.blue, bold: true, size: 15 }); text(ctx, 'point 1', 118, 150, { bold: true, color: C.muted, size: 12, align: 'right' }); text(ctx, 'point 2', 262, 150, { bold: true, color: C.muted, size: 12, align: 'left' });
      text(ctx, '+', 118, 38, { bold: true, color: C.muted, size: 16 }); text(ctx, '−', 118, 266, { bold: true, color: C.muted, size: 16 });
      const g1 = ctrl && x.pm >= a && x.pm < a + 8, g2 = ctrl && x.pm >= 180 + a && x.pm < 188 + a;
      xs.forEach((px, k) => {
        diodeSym(ctx, px, 100, -90, x.top === k ? 'on' : 'off', tn[k], { gate: ctrl, pulse: k ? g2 : g1, ak: !ctrl && k === 0 });
        diodeSym(ctx, px, 200, -90, x.bot === k ? 'on' : 'off', bn[k]);
      });
      if (x.on && Math.abs(x.u) > 6) {
        s.off += dt * 110 * (0.25 + 0.75 * Math.abs(x.u) / VMAX);
        dots(ctx, [[xs[x.top], 150], [xs[x.top], 50], [400, 50], [400, 250], [xs[x.bot], 250], [xs[x.bot], 150], [xs[x.top], 150]], s.off);
      }
      let b, col, msg;
      if (!x.on) { b = ctrl ? 'Tout est bloqué : on attend l’impulsion' : 'Rien ne conduit (tension nulle)'; col = C.red; msg = ctrl ? 'La tension est dans le bon sens, mais le thyristor n’a pas encore reçu son impulsion (angle α). Donc aucun courant : la lampe est éteinte.' : 'La tension du réseau passe par zéro : tous les repères sont proches de 0 V.'; }
      else if (x.top === 0) { b = `${tn[0]} et ${bn[1]} conduisent`; col = C.green; msg = `Demi-période positive : le <b>point 1</b> est le plus haut, le <b>point 2</b> le plus bas. Le courant part du point 1, traverse ${tn[0]}, la lampe (de haut en bas), puis ${bn[1]} et revient au point 2. Dans la lampe le courant va <b>vers le bas</b>.`; }
      else { b = `${tn[1]} et ${bn[0]} conduisent`; col = C.green; msg = `Demi-période négative : maintenant c’est le <b>point 2</b> le plus haut. Le courant part du point 2, traverse ${tn[1]}, la lampe, puis ${bn[0]} et revient au point 1. Dans la lampe le courant va <b>encore vers le bas</b> : c’est le redressement.`; }
      s.show(b, col, [['v (prise)', fmt(x.v) + ' V'], ['u (lampe)', fmt(x.u) + ' V'], ['moyenne ⟨u⟩', fmt(mean) + ' V'], ['énergie reçue par la lampe', fmt(level * 100) + ' %']], msg);
      const panels = [{ w: 1.6, min: -360, max: 360, yticks: [-300, 0, 300], label: 'tensions (V)', shade: zones(t => st(t).top === 0, 720), traces: [{ f: mean ? () => mean : () => 0, c: C.green, w: 1, dash: [5, 4], nodot: true, noghost: true }, { f: vAt, c: C.blue, w: 1.6 }, { f: t => st(t).u, c: C.green, w: 3.5 }] }];
      if (ctrl) panels.push({ w: 0.5, min: -0.2, max: 1.7, yticks: [], label: 'impulsions de gâchette', traces: [{ f: t => { const p = ((t % 360) + 360) % 360; return p >= a && p < a + 8 ? 1 : 0; }, c: C.violet }, { f: t => { const p = ((t % 360) + 360) % 360; return p >= 180 + a && p < 188 + a ? 1 : 0; }, c: C.orange }] });
      plot(s.plt, { h: ctrl ? 400 : 340, span: 720, cursor: s.t, ticks: acTicks, N: 900, panels });
    }
  });
}
bridgeSim('pd2', false);
bridgeSim('pcom', true);

/* ============ 3. Pont triphasé ============ */
new Sim('pd3', {
  span: () => 360, dur: 10,
  legend: '<span><i style="background:#2f6fd6"></i>phase 1</span><span><i style="background:#138a8a"></i>phase 2</span><span><i style="background:#7a4cc2"></i>phase 3</span><span><i style="background:#1d9a52"></i>tension reçue u</span><span><i class="z"></i>D1 conduit</span>',
  draw(s, dt) {
    const st = th => { const v = [0, 1, 2].map(k => VMAX * Math.sin((th - 120 * k) * D2R)); const hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v)); return { v, hi, lo, u: v[hi] - v[lo] }; };
    const x = st(s.t), xs = [100, 190, 280];
    const ctx = prep(s.sch, 460, 290);
    lamp(ctx, 400, 150, 1);
    wire(ctx, [[100, 50], [400, 50], [400, 128]]); wire(ctx, [[400, 172], [400, 250], [100, 250]]);
    xs.forEach((px, k) => {
      wire(ctx, [[px, 50], [px, 88]]); wire(ctx, [[px, 112], [px, 188]]); wire(ctx, [[px, 212], [px, 250]]);
      dot(ctx, px, 50); dot(ctx, px, 150); dot(ctx, px, 250);
      wire(ctx, [[px, 150], [px + 30, 150]]); ctx.fillStyle = '#fff'; ctx.strokeStyle = [C.blue, C.teal, C.violet][k]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(px + 35, 150, 5, 0, 7); ctx.fill(); ctx.stroke();
      text(ctx, 'phase ' + (k + 1), px + 40, 170, { size: 11.5, color: [C.blue, C.teal, C.violet][k], bold: true });
      diodeSym(ctx, px, 100, -90, x.hi === k ? 'on' : 'off', 'D' + (k + 1), { ak: k === 0 });
      diodeSym(ctx, px, 200, -90, x.lo === k ? 'on' : 'off', 'D' + (k + 4));
    });
    text(ctx, '+', 80, 38, { bold: true, color: C.muted, size: 16 }); text(ctx, '−', 80, 266, { bold: true, color: C.muted, size: 16 });
    s.off += dt * 110 * 0.9;
    dots(ctx, [[xs[x.hi], 150], [xs[x.hi], 50], [400, 50], [400, 250], [xs[x.lo], 250], [xs[x.lo], 150]], s.off);
    s.show(`D${x.hi + 1} et D${x.lo + 4} conduisent`, C.green, [['angle θ', fmt(s.t) + '°'], ['phase la plus haute', 'phase ' + (x.hi + 1)], ['phase la plus basse', 'phase ' + (x.lo + 1)], ['u (lampe)', fmt(x.u) + ' V'], ['moyenne ⟨u⟩', '≈ 540 V']],
      `En haut, c’est la diode de la phase <b>la plus haute</b> (phase ${x.hi + 1}) qui conduit. En bas, c’est la diode de la phase <b>la plus basse</b> (phase ${x.lo + 1}). La lampe reçoit la différence entre les deux : u = v${x.hi + 1} − v${x.lo + 1}. Elle est toujours positive.`);
    const ticks = [0, 60, 120, 180, 240, 300, 360].map(t => [t, t + '°']);
    plot(s.plt, { h: 420, span: 360, cursor: s.t, ticks, panels: [
      { w: 1.1, min: -360, max: 360, yticks: [-300, 0, 300], label: 'tensions des 3 phases (V)', shade: zones(t => st(t).hi === 0, 360, '#d6f2e2', 720), traces: [{ f: t => st(t).v[0], c: C.blue }, { f: t => st(t).v[1], c: C.teal }, { f: t => st(t).v[2], c: C.violet }] },
      { w: 1, min: 0, max: 640, yticks: [0, 200, 400, 540, 600], label: 'tension reçue u (V)', shade: zones(t => st(t).hi === 0, 360, '#d6f2e2', 720), traces: [{ f: () => 540, c: C.green, w: 1, dash: [5, 4], nodot: true, noghost: true }, { f: t => st(t).u, c: C.green, w: 3.5 }] }] });
  }
});

/* ============ 4. Thyristor seul ============ */
new Sim('thy', {
  span: () => 720, dur: 10,
  controls: `<label class="ctl">Retard α <input type="range" id="thy-a" min="0" max="170" step="5" value="90"><output id="thy-a-o">90°</output></label>`,
  legend: '<span><i style="background:#2f6fd6"></i>tension de la prise v</span><span><i style="background:#1d9a52"></i>tension reçue par la lampe u</span><span><i style="background:#7a4cc2"></i>impulsion sur la gâchette</span><span><i class="z"></i>le thyristor conduit</span>',
  init(s) { s.a = 90; const r = s.q('#thy-a'), o = s.q('#thy-a-o'); r.oninput = () => { s.a = +r.value; o.textContent = s.a + '°'; s.render(0); }; },
  draw(s, dt) {
    const a = s.a, pmOf = th => ((th % 360) + 360) % 360, cond = th => { const p = pmOf(th); return p >= a && p < 180; };
    const pm = pmOf(s.t), v = vAt(s.t), on = cond(s.t), u = on ? v : 0, pulse = pm >= a && pm < a + 8;
    const level = 0.5 * halfPower(a * D2R);
    const ctx = prep(s.sch, 460, 290);
    lamp(ctx, 400, 150, level);
    wire(ctx, [[70, 128], [70, 60], [188, 60]]); wire(ctx, [[212, 60], [400, 60], [400, 128]]); wire(ctx, [[400, 172], [400, 250], [70, 250], [70, 172]]);
    acSource(ctx, 70, 150); text(ctx, 'v', 36, 150, { color: C.blue, bold: true, size: 16 }); text(ctx, '+', 96, 118, { color: C.muted, bold: true }); text(ctx, '−', 96, 184, { color: C.muted, bold: true });
    diodeSym(ctx, 200, 60, 0, on ? 'on' : 'off', 'T', { gate: true, pulse, ak: true });
    if (on && v > 8) { s.off += dt * 110 * (0.25 + 0.75 * v / VMAX); dots(ctx, [[70, 128], [70, 60], [400, 60], [400, 250], [70, 250], [70, 172]], s.off); }
    let b, col, msg;
    if (pm >= 180) { b = 'Bloqué : tension négative'; col = C.red; msg = 'La tension est négative : l’anode A est plus basse que la cathode K. Comme une diode, le thyristor bloque, impulsion ou pas.'; }
    else if (pm < a) { b = 'Bloqué : en attente de l’impulsion'; col = C.orange; msg = 'A est plus haut que K (première condition remplie ✔), mais <b>personne n’a envoyé d’impulsion sur la gâchette G</b> (deuxième condition ✘). Le thyristor reste bloqué et la lampe éteinte.'; }
    else if (pulse) { b = 'Impulsion sur G : amorçage !'; col = C.green; msg = 'Les deux conditions sont réunies (A plus haut que K <b>et</b> impulsion sur G) : le thyristor s’amorce et devient passant d’un coup.'; }
    else { b = 'Le thyristor conduit'; col = C.green; msg = 'L’impulsion est finie, mais le thyristor <b>reste passant tout seul</b>. Il ne se bloquera que quand le courant redescendra à zéro, à la fin de la demi-période.'; }
    s.show(b, col, [['angle θ', fmt(pm) + '°'], ['tension prise v', fmt(v) + ' V'], ['tension lampe u', fmt(u) + ' V'], ['énergie reçue par la lampe', fmt(level * 100) + ' %']], msg);
    plot(s.plt, { h: 380, span: 720, cursor: s.t, ticks: acTicks, N: 900, panels: [
      { w: 1.5, min: -360, max: 360, yticks: [-300, 0, 300], label: 'tensions (V)', shade: zones(cond, 720), traces: [{ f: vAt, c: C.blue, w: 1.6 }, { f: t => cond(t) ? vAt(t) : 0, c: C.green, w: 3.5 }] },
      { w: 0.5, min: -0.2, max: 1.7, yticks: [], label: 'impulsion sur la gâchette G', traces: [{ f: t => { const p = pmOf(t); return p >= a && p < a + 8 ? 1 : 0; }, c: C.violet }] }] });
  }
});

/* ============ 6. Hacheur ============ */
new Sim('hac', {
  span: s => 3 / s.f, dur: 9,
  controls: `<label class="ctl">Rapport cyclique <input type="range" id="hac-a" min="0.1" max="0.9" step="0.1" value="0.5"><output id="hac-a-o">0,5</output></label>
    <div class="seg" id="hac-mode"><button type="button" data-v="R">Charge simple</button><button type="button" data-v="RL" class="on">Moteur (avec bobine)</button></div>
    <div class="seg" id="hac-f"><button type="button" data-v="0.5">0,5 kHz</button><button type="button" data-v="1" class="on">1 kHz</button><button type="button" data-v="2">2 kHz</button><button type="button" data-v="4">4 kHz</button></div>`,
  legend: '<span><i style="background:#7a4cc2"></i>interrupteur S (1 = fermé)</span><span><i style="background:#1d9a52"></i>tension u</span><span><i style="background:#2f6fd6"></i>courant i</span><span><i class="z"></i>S fermé</span>',
  init(s) {
    s.alpha = 0.5; s.mode = 'RL'; s.f = 1;
    const r = s.q('#hac-a'), o = s.q('#hac-a-o'); r.oninput = () => { s.alpha = +r.value; o.textContent = fmt(s.alpha, 1); s.render(0); };
    seg(s.q('#hac-mode'), v => { s.mode = v; s.render(0); }); seg(s.q('#hac-f'), v => { s.f = +v; s.t = 0; s.render(0); });
  },
  draw(s, dt) {
    const V = 200, R = 10, L = 20, T = 1 / s.f, tau = L / R, a = s.alpha, rl = s.mode === 'RL';
    const Imax = V / R * (1 - Math.exp(-a * T / tau)) / (1 - Math.exp(-T / tau)), Imin = Imax * Math.exp(-(1 - a) * T / tau);
    const at = t => { const tp = ((t % T) + T) % T, on = tp < a * T; const i = !rl ? (on ? V / R : 0) : (on ? V / R + (Imin - V / R) * Math.exp(-tp / tau) : Imax * Math.exp(-(tp - a * T) / tau)); return { on, u: on ? V : 0, i }; };
    const x = at(s.t);
    const ctx = prep(s.sch, 460, 290);
    battery(ctx, 60, 150);
    wire(ctx, [[60, 145], [60, 60], [124, 60]]); wire(ctx, [[176, 60], [rl ? 262 : 400, 60]]);
    if (rl) { coil(ctx, 262, 60, 4); wire(ctx, [[326, 60], [400, 60]]); text(ctx, 'bobine du moteur', 294, 36, { size: 11.5, color: C.muted }); }
    wire(ctx, [[400, 60], [400, 124]]); box(ctx, 400, 150, 30, 52, ''); text(ctx, 'R', 400, 150, { bold: true }); wire(ctx, [[400, 176], [400, 250], [60, 250], [60, 156]]);
    text(ctx, 'résistance', 376, 142, { size: 11.5, color: C.muted, align: 'right' }); text(ctx, 'du moteur', 376, 158, { size: 11.5, color: C.muted, align: 'right' }); text(ctx, '200 V', 30, 186, { size: 11, color: C.blue, bold: true });
    switchH(ctx, 150, 60, x.on, 'S');
    if (rl) { wire(ctx, [[230, 60], [230, 138]]); wire(ctx, [[230, 162], [230, 250]]); dot(ctx, 230, 60); dot(ctx, 230, 250); diodeSym(ctx, 230, 150, -90, x.on ? 'off' : (x.i > 0.05 ? 'on' : 'idle'), 'D', { }); text(ctx, 'diode de roue libre', 196, 205, { size: 11.5, color: C.muted, align: 'right' }); }
    s.off += dt * 140 * (0.2 + x.i / 20);
    if (x.on) dots(ctx, [[60, 145], [60, 60], [400, 60], [400, 250], [60, 250], [60, 156]], s.off);
    else if (rl && x.i > 0.05) dots(ctx, [[230, 60], [400, 60], [400, 250], [230, 250], [230, 60]], s.off, C.orange);
    const diI = Imax - Imin;
    let b, col, msg;
    if (x.on) { b = 'S fermé : la source alimente la charge'; col = C.green; msg = 'u = 200 V. ' + (rl ? 'La bobine résiste aux changements : <b>le courant monte progressivement</b> au lieu de sauter d’un coup.' : 'Le courant est tout de suite à sa valeur maximale (u / R).'); }
    else if (rl) { b = 'S ouvert : roue libre par la diode'; col = C.orange; msg = 'La bobine refuse que le courant s’arrête net : elle le fait passer par la <b>diode de roue libre</b> (points orange). u = 0 mais le courant continue, en <b>baissant doucement</b>. Sans cette diode, la coupure brutale créerait une énorme surtension qui détruirait l’interrupteur.'; }
    else { b = 'S ouvert : plus rien n’est branché'; col = C.red; msg = 'La charge est déconnectée : u = 0 et i = 0.'; }
    s.show(b, col, [['tension u', fmt(x.u) + ' V'], ['courant i', fmt(x.i, 1) + ' A'], ['moyenne ⟨u⟩ = α × 200', fmt(a * V) + ' V'], ['moyenne ⟨i⟩', fmt(a * V / R, 1) + ' A'], ['ondulation du courant', rl ? fmt(diI, 1) + ' A' : '—']], msg);
    const lab = k => k === 0 ? '0' : String(+(k * T).toFixed(2)).replace('.', ',') + ' ms';
    const sh = [0, 1, 2].map(k => [k * T, (k + a) * T, '#d6f2e2']);
    plot(s.plt, { h: 420, span: 3 * T, cursor: s.t, ticks: [0, 1, 2, 3].map(k => [k * T, lab(k)]), N: 900, panels: [
      { w: 0.45, min: -0.2, max: 1.7, yticks: [], label: 'interrupteur S', shade: sh, traces: [{ f: t => at(t).on ? 1 : 0, c: C.violet }] },
      { w: 0.9, min: -15, max: 250, yticks: [0, 100, 200], label: 'tension u (V)', shade: sh, traces: [{ f: () => a * V, c: C.green, w: 1, dash: [5, 4], nodot: true, noghost: true }, { f: t => at(t).u, c: C.green, w: 3 }] },
      { w: 1, min: 0, max: 21, yticks: [0, 5, 10, 15, 20], label: 'courant i (A)', shade: sh, traces: [{ f: () => a * V / R, c: C.blue, w: 1, dash: [5, 4], nodot: true, noghost: true }, { f: t => at(t).i, c: C.blue, w: 2.5 }] }] });
  }
});

/* ============ 7. Onduleur ============ */
(() => {
  const T = 20, N = 4000, R = 10, L = 30, VD = 48, tri = x => 4 * Math.abs(x - Math.floor(x + 0.5)) - 1;
  const cmd = (s, t) => { const ph = ((t % T) + T) % T / T; if (s.mode === 'sq') return ph < 0.5 ? { u: VD, k: [1, 4] } : { u: -VD, k: [2, 3] }; return s.r * Math.sin(2 * Math.PI * ph) >= tri(15 * ph) ? { u: VD, k: [1, 4] } : { u: -VD, k: [2, 3] }; };
  function compute(s) {
    const key = s.mode + s.r; if (s.key === key) return; s.key = key;
    const dt = T / N, e = Math.exp(-dt / (L / R)), cur = new Float64Array(2 * N); let i = 0;
    for (let p = 0; p < 8; p++) for (let k = 0; k < N; k++) { const u = cmd(s, k * dt).u; i = u / R + (i - u / R) * e; if (p >= 6) cur[(p - 6) * N + k] = i; }
    s.cur = cur;
  }
  new Sim('ond', {
    span: () => 40, dur: 10,
    controls: `<div class="seg" id="ond-mode"><button type="button" data-v="sq" class="on">Créneau simple</button><button type="button" data-v="mli">Découpage fin (MLI)</button></div>
      <label class="ctl" id="ond-r-c" style="display:none">Amplitude <input type="range" id="ond-r" min="0.2" max="1" step="0.1" value="0.8"><output id="ond-r-o">0,8</output></label>`,
    legend: '<span><i style="background:#1d9a52"></i>tension u appliquée au moteur</span><span><i style="background:#cfd5df"></i>sinusoïde qu’on voudrait obtenir</span><span><i style="background:#2f6fd6"></i>courant i dans le moteur</span>',
    init(s) {
      s.mode = 'sq'; s.r = 0.8;
      seg(s.q('#ond-mode'), v => { s.mode = v; s.q('#ond-r-c').style.display = v === 'mli' ? '' : 'none'; s.render(0); });
      const r = s.q('#ond-r'), o = s.q('#ond-r-o'); r.oninput = () => { s.r = +r.value; o.textContent = fmt(s.r, 1); s.render(0); };
    },
    draw(s, dt) {
      compute(s);
      const c = cmd(s, s.t), iAt = t => s.cur[Math.min(2 * N - 1, Math.max(0, Math.floor(t / (T / N))))], i = iAt(s.t), cl = new Set(c.k);
      const amp = s.mode === 'sq' ? 4 * VD / Math.PI : s.r * VD, target = t => amp * Math.sin(2 * Math.PI * t / T);
      const ctx = prep(s.sch, 460, 290);
      battery(ctx, 52, 150);
      wire(ctx, [[52, 145], [52, 40], [330, 40]]); wire(ctx, [[52, 156], [52, 262], [330, 262]]); text(ctx, '48 V', 30, 186, { size: 11, color: C.blue, bold: true });
      [170, 330].forEach(px => { wire(ctx, [[px, 40], [px, 73]]); wire(ctx, [[px, 117], [px, 183]]); wire(ctx, [[px, 227], [px, 262]]); dot(ctx, px, 150); });
      wire(ctx, [[170, 150], [215, 150]]); box(ctx, 250, 150, 70, 38, ''); text(ctx, 'moteur', 250, 178, { size: 12, color: C.muted }); wire(ctx, [[285, 150], [330, 150]]);
      switchV(ctx, 170, 95, cl.has(1), 'S1'); switchV(ctx, 330, 95, cl.has(2), 'S2'); switchV(ctx, 170, 205, cl.has(3), 'S3'); switchV(ctx, 330, 205, cl.has(4), 'S4');
      s.off += dt * 120;
      dots(ctx, c.u > 0 ? [[52, 145], [52, 40], [170, 40], [170, 150], [330, 150], [330, 262], [52, 262], [52, 156]] : [[52, 145], [52, 40], [330, 40], [330, 150], [170, 150], [170, 262], [52, 262], [52, 156]], s.off);
      s.show(`S${c.k[0]} et S${c.k[1]} fermés → u = ${c.u > 0 ? '+' : '−'}48 V`, c.u > 0 ? C.green : C.violet, [['tension u', fmt(c.u) + ' V'], ['courant i', fmt(i, 2) + ' A'], ['sinusoïde visée', fmt(target(s.t)) + ' V'], ['amplitude de la sinusoïde', fmt(amp, 1) + ' V']],
        (s.mode === 'sq' ? 'Pendant une demi-période on ferme <b>S1 et S4</b> : le moteur reçoit +48 V. À la demi-période suivante on ferme <b>S2 et S3</b> : il reçoit −48 V. La tension s’inverse donc 50 fois par seconde : c’est de l’alternatif, même s’il est « carré ».' : 'On ouvre et on ferme les interrupteurs <b>très vite</b>, avec des créneaux larges quand la sinusoïde visée est haute et étroits quand elle est basse. La bobine du moteur lisse le tout : le courant ressemble à une vraie sinusoïde.') + ' Le courant ne suit pas instantanément la tension à cause de la bobine du moteur.');
      plot(s.plt, { h: 380, span: 40, cursor: s.t, ticks: [0, 10, 20, 30, 40].map(t => [t, t + ' ms']), N: 2400, panels: [
        { w: 1, min: -66, max: 66, yticks: [-48, 0, 48], label: 'tension u (V)', traces: [{ f: target, c: '#cfd5df', w: 2, nodot: true, noghost: true }, { f: t => cmd(s, t).u, c: C.green, w: 2.5 }] },
        { w: 0.9, min: -5.5, max: 5.5, yticks: [-4, 0, 4], label: 'courant i (A)', traces: [{ f: iAt, c: C.blue, w: 2.5 }] }] });
    }
  });
})();

/* ============ 8. Gradateur ============ */
new Sim('grad', {
  span: () => 720, dur: 10,
  controls: `<label class="ctl">Retard α <input type="range" id="grad-a" min="0" max="170" step="5" value="90"><output id="grad-a-o">90°</output></label>`,
  legend: '<span><i style="background:#2f6fd6"></i>tension de la prise v</span><span><i style="background:#1d9a52"></i>tension reçue par la lampe u</span><span><i style="background:#7a4cc2"></i>impulsion sur T1</span><span><i style="background:#df8516"></i>impulsion sur T2</span>',
  init(s) { s.a = 90; const r = s.q('#grad-a'), o = s.q('#grad-a-o'); r.oninput = () => { s.a = +r.value; o.textContent = s.a + '°'; s.render(0); }; },
  draw(s, dt) {
    const a = s.a, pmOf = th => ((th % 360) + 360) % 360;
    const st = th => { const p = pmOf(th), v = vAt(th), t1 = p >= a && p < 180, t2 = p >= 180 + a; return { v, u: t1 || t2 ? v : 0, t1, t2, p }; };
    const x = st(s.t), level = halfPower(a * D2R), g1 = x.p >= a && x.p < a + 8, g2 = x.p >= 180 + a && x.p < 188 + a;
    const ctx = prep(s.sch, 460, 290);
    lamp(ctx, 400, 150, level);
    wire(ctx, [[70, 128], [70, 70], [140, 70]]); wire(ctx, [[140, 70], [140, 35], [188, 35]]); wire(ctx, [[212, 35], [300, 35], [300, 70]]);
    wire(ctx, [[140, 70], [140, 105], [188, 105]]); wire(ctx, [[212, 105], [300, 105], [300, 70]]); wire(ctx, [[300, 70], [400, 70], [400, 128]]);
    wire(ctx, [[400, 172], [400, 250], [70, 250], [70, 172]]); dot(ctx, 140, 70); dot(ctx, 300, 70);
    acSource(ctx, 70, 150); text(ctx, 'v', 36, 150, { color: C.blue, bold: true, size: 16 });
    diodeSym(ctx, 200, 35, 0, x.t1 ? 'on' : 'off', 'T1', { gate: true, pulse: g1 });
    diodeSym(ctx, 200, 105, 180, x.t2 ? 'on' : 'off', 'T2', { gate: true, pulse: g2 });
    if ((x.t1 || x.t2) && Math.abs(x.u) > 8) {
      s.off += dt * 110 * (0.25 + 0.75 * Math.abs(x.u) / VMAX);
      dots(ctx, x.t1 ? [[70, 128], [70, 70], [140, 70], [140, 35], [300, 35], [300, 70], [400, 70], [400, 250], [70, 250], [70, 172]] : [[70, 172], [70, 250], [400, 250], [400, 70], [300, 70], [300, 105], [140, 105], [140, 70], [70, 70], [70, 128]], s.off);
    }
    let b, col, msg;
    if (x.t1) { b = 'T1 conduit (demi-période +)'; col = C.green; msg = 'T1 laisse passer l’alternance positive. La lampe reçoit la tension du réseau.'; }
    else if (x.t2) { b = 'T2 conduit (demi-période −)'; col = C.green; msg = 'T2 est monté « à l’envers » de T1 : il laisse passer l’alternance négative. Le courant dans la lampe est inversé, c’est de l’alternatif.'; }
    else { b = 'T1 et T2 bloqués'; col = C.red; msg = `On attend l’impulsion (retard α = ${a}°). Pendant ce temps la lampe ne reçoit rien. Plus α est grand, moins la lampe reste alimentée, donc moins elle éclaire.`; }
    s.show(b, col, [['angle θ', fmt(x.p) + '°'], ['tension prise v', fmt(x.v) + ' V'], ['tension lampe u', fmt(x.u) + ' V'], ['énergie reçue par la lampe', fmt(level * 100) + ' %']], msg);
    plot(s.plt, { h: 400, span: 720, cursor: s.t, ticks: acTicks, N: 900, panels: [
      { w: 1.5, min: -360, max: 360, yticks: [-300, 0, 300], label: 'tensions (V)', shade: zones(t => st(t).t1 || st(t).t2, 720), traces: [{ f: vAt, c: C.blue, w: 1.6 }, { f: t => st(t).u, c: C.green, w: 3.5 }] },
      { w: 0.5, min: -0.2, max: 1.7, yticks: [], label: 'impulsions de gâchette', traces: [{ f: t => { const p = pmOf(t); return p >= a && p < a + 8 ? 1 : 0; }, c: C.violet }, { f: t => { const p = pmOf(t); return p >= 180 + a && p < 188 + a ? 1 : 0; }, c: C.orange }] }] });
  }
});

/* ============ QCM ============ */
const QCM = {
  diode: [
    { q: 'Une diode est branchée entre un point à +10 V (côté anode) et un point à +2 V (côté cathode). Que fait-elle ?', o: ['Elle conduit', 'Elle bloque', 'Ça dépend de la fréquence'], a: 0, why: 'L’anode est plus haute que la cathode : la diode est passante, comme un fil (elle perd seulement environ 1 V en vrai).' },
    { q: 'Sur le symbole de la diode, où se trouve la cathode (K) ?', o: ['Du côté de la barre', 'Du côté plat du triangle', 'Au milieu du triangle'], a: 0, why: 'La cathode est du côté de la barre : c’est la sortie par où le courant s’en va. Le triangle est une flèche qui pointe vers la cathode.' },
    { q: 'Une diode est branchée entre la prise 230 V et une lampe. Que reçoit la lampe ?', o: ['Les deux demi-périodes', 'Une demi-période sur deux', 'Du continu parfaitement lisse'], a: 1, why: 'La diode bloque pendant la demi-période où la tension est inversée. Il ne reste que les alternances positives : la lampe éclaire à moitié.' },
    { q: 'On retourne la diode (anode et cathode échangées). Que laisse-t-elle passer ?', o: ['Plus rien', 'Seulement les alternances négatives', 'Les deux comme avant'], a: 1, why: 'C’est le même clapet, monté dans l’autre sens : il laisse passer ce qu’il bloquait avant.' }
  ],
  pd2: [
    { q: 'Dans le pont monophasé, combien de diodes conduisent en même temps ?', o: ['1', '2', '4'], a: 1, why: 'Une du haut et une du bas : par exemple D1 et D4 puis D2 et D3. Le courant fait un aller-retour dans la lampe en passant par deux diodes.' },
    { q: 'Quand la tension de la prise devient négative, que devient le sens du courant dans la lampe ?', o: ['Il s’inverse aussi', 'Il reste le même', 'Il s’annule pendant toute la demi-période'], a: 1, why: 'C’est tout l’intérêt du pont : il « aiguille » le courant pour qu’il traverse toujours la lampe dans le même sens.' },
    { q: 'La prise est à 50 Hz. Quelle est la fréquence de la tension u reçue par la lampe ?', o: ['50 Hz', '100 Hz', '150 Hz'], a: 1, why: 'u a deux « bosses » par période du réseau : on compte 100 bosses par seconde.' },
    { q: 'Quelle est la valeur moyenne de u (réseau 230 V) ?', o: ['≈ 207 V', '230 V', '325 V'], a: 0, why: 'La moyenne vaut 2 × 325 / π ≈ 207 V, c’est-à-dire environ 0,9 × 230 V. Elle est plus basse que le maximum (325 V) car la tension passe aussi par 0.' }
  ],
  pd3: [
    { q: 'Dans le groupe du haut (D1, D2, D3), quelle diode conduit ?', o: ['Celle de la phase la plus haute', 'Celle de la phase la plus basse', 'Les trois ensemble'], a: 0, why: 'Chaque diode du haut est reliée à une phase : c’est celle qui a la tension la plus haute qui l’emporte, les deux autres sont bloquées.' },
    { q: 'Combien de diodes conduisent en même temps dans le pont triphasé ?', o: ['2', '3', '6'], a: 0, why: 'Une en haut (phase la plus haute) et une en bas (phase la plus basse).' },
    { q: 'Pendant combien de degrés une diode conduit-elle par période (360°) ?', o: ['60°', '120°', '180°'], a: 1, why: 'Trois diodes se relaient en haut, donc chacune garde la main 360° / 3 = 120°.' },
    { q: 'Pourquoi la tension u du pont triphasé est-elle plus « lisse » qu’en monophasé ?', o: ['Parce qu’il y a plus de diodes qui conduisent en même temps', 'Parce qu’il y a 6 bosses par période qui se chevauchent près de leur sommet', 'Parce que la fréquence est plus basse'], a: 1, why: 'Avec 6 bosses par période (au lieu de 2), u ne descend jamais très bas : elle reste entre environ 487 V et 563 V.' }
  ],
  thy: [
    { q: 'Quelles sont les deux conditions pour qu’un thyristor s’amorce ?', o: ['Anode plus haute que cathode ET impulsion sur la gâchette', 'Impulsion sur la gâchette seulement', 'Anode plus basse que cathode ET impulsion'], a: 0, why: 'Sans la première condition, c’est comme une diode bloquée. Sans la seconde, il reste bloqué même avec la bonne polarité.' },
    { q: 'Le thyristor est amorcé, on coupe le courant de gâchette. Que se passe-t-il ?', o: ['Il se bloque tout de suite', 'Il continue de conduire jusqu’à ce que son courant s’annule', 'Il se détruit'], a: 1, why: 'C’est l’« effet mémoire » : la gâchette sert seulement à lancer la conduction, pas à l’entretenir.' },
    { q: 'On augmente le retard α. Que devient l’énergie reçue par la lampe ?', o: ['Elle augmente', 'Elle diminue', 'Elle ne change pas'], a: 1, why: 'On amorce plus tard dans la demi-période : le thyristor conduit moins longtemps, la lampe reste moins longtemps alimentée.' },
    { q: 'Que devient un thyristor commandé avec α = 0° ?', o: ['Il se comporte comme une diode', 'Il ne conduit jamais', 'Il conduit en permanence'], a: 0, why: 'Il s’amorce dès que l’anode devient plus haute que la cathode, exactement comme une diode.' }
  ],
  pcom: [
    { q: 'Sur quoi agit-on pour régler la tension moyenne de sortie d’un pont commandé ?', o: ['Sur l’angle α', 'Sur la fréquence du réseau', 'Sur le nombre de diodes'], a: 0, why: 'En retardant l’amorçage des thyristors (α plus grand), la lampe reçoit une plus petite partie de chaque sinusoïde.' },
    { q: 'Que vaut approximativement la tension moyenne quand α est proche de 180° ?', o: ['Presque 0 V', '≈ 207 V', '325 V'], a: 0, why: 'Les thyristors s’amorcent à la toute fin de la demi-période : presque rien n’est transmis à la charge.' },
    { q: 'Quelle différence entre le pont mixte et le pont à diodes ?', o: ['Deux diodes sont remplacées par des thyristors', 'Il a 6 diodes', 'Il fonctionne uniquement en triphasé'], a: 0, why: 'Les deux diodes du haut deviennent T1 et T2. Les deux du bas restent des diodes.' }
  ],
  hac: [
    { q: 'Source 200 V, rapport cyclique 0,25. Quelle est la tension moyenne ⟨u⟩ ?', o: ['50 V', '100 V', '200 V'], a: 0, why: '⟨u⟩ = rapport cyclique × tension de la source = 0,25 × 200 = 50 V.' },
    { q: 'À quoi sert la diode de roue libre ?', o: ['À redresser la source', 'À offrir un chemin au courant de la bobine quand S s’ouvre', 'À augmenter la tension'], a: 1, why: 'Une bobine ne supporte pas qu’on coupe son courant d’un coup. La diode lui permet de continuer à circuler et évite une surtension destructrice.' },
    { q: 'Comment réduire l’ondulation du courant ?', o: ['Augmenter la bobine ou la fréquence de découpage', 'Diminuer la bobine', 'Diminuer la fréquence'], a: 0, why: 'Plus de bobine = courant plus « inerte » ; plus de fréquence = phases plus courtes. Le prix : plus de fréquence, ce sont plus de pertes dans l’interrupteur.' },
    { q: 'Un hacheur transforme…', o: ['du continu en continu (autre valeur)', 'de l’alternatif en continu', 'du continu en alternatif'], a: 0, why: 'On entre en continu, on sort en continu, mais avec une tension moyenne réglable.' }
  ],
  ond: [
    { q: 'Quels interrupteurs ne doivent jamais être fermés ensemble ?', o: ['S1 et S4', 'S1 et S3', 'S2 et S3'], a: 1, why: 'S1 et S3 sont sur le même bras : les fermer ensemble branche directement le + de la source sur son − (court-circuit).' },
    { q: 'Que faut-il fermer pour que le moteur reçoive −48 V ?', o: ['S1 et S4', 'S2 et S3', 'S1 et S2'], a: 1, why: 'S2 et S3 branchent le moteur dans l’autre sens : la tension est inversée.' },
    { q: 'Quel est l’intérêt du découpage fin (MLI) ?', o: ['Il augmente la tension de la batterie', 'Il rapproche le courant d’une sinusoïde', 'Il supprime la bobine du moteur'], a: 1, why: 'En découpant plus finement, la tension moyenne locale suit une sinusoïde, et la bobine lisse le reste.' },
    { q: 'Pourquoi le courant ne suit-il pas instantanément la tension ?', o: ['À cause de la bobine du moteur', 'À cause de la batterie', 'À cause de la diode'], a: 0, why: 'Une bobine s’oppose aux variations rapides de courant : il met du temps à monter ou à descendre.' }
  ],
  grad: [
    { q: 'Un gradateur transforme…', o: ['de l’alternatif en alternatif (de moindre valeur efficace)', 'de l’alternatif en continu', 'du continu en alternatif'], a: 0, why: 'On entre sur le secteur et on ressort en alternatif, mais avec une partie de chaque sinusoïde « rognée ».' },
    { q: 'Pourquoi faut-il deux thyristors montés tête-bêche ?', o: ['Un pour chaque demi-période', 'Pour doubler le courant', 'Pour redresser'], a: 0, why: 'Un thyristor ne conduit que dans un sens. T1 gère l’alternance positive, T2 l’alternance négative.' },
    { q: 'Avec α = 90°, quelle part de l’énergie la lampe reçoit-elle ?', o: ['25 %', '50 %', '100 %'], a: 1, why: 'On laisse passer la moitié de chaque demi-période : on trouve exactement 50 % de la puissance maximale.' },
    { q: 'Où trouve-t-on un gradateur dans le bâtiment ?', o: ['Dans un variateur d’éclairage ou de chauffage électrique', 'Dans un chargeur de batterie', 'Dans un onduleur photovoltaïque'], a: 0, why: 'Il règle la puissance d’une lampe ou d’une résistance chauffante sans changer la fréquence.' }
  ],
  final: [
    { q: 'Tu veux recharger une batterie à partir du secteur. Quel convertisseur est à l’entrée ?', o: ['Un redresseur', 'Un gradateur', 'Un onduleur'], a: 0, why: 'Il faut passer de l’alternatif au continu : redresseur.' },
    { q: 'Des panneaux photovoltaïques produisent du continu. Pour injecter dans le réseau, il faut :', o: ['Un onduleur', 'Un redresseur', 'Un gradateur'], a: 0, why: 'On passe du continu à l’alternatif : onduleur.' },
    { q: 'Tu alimentes un luminaire LED en 12 V à partir d’un réseau continu de 48 V. Il faut :', o: ['Un hacheur', 'Un pont de diodes', 'Un gradateur'], a: 0, why: 'Continu vers continu avec une autre valeur : hacheur.' },
    { q: 'Un variateur de vitesse pour une pompe de ventilation alimentée en triphasé contient surtout :', o: ['Un redresseur puis un onduleur', 'Uniquement un gradateur', 'Uniquement un hacheur'], a: 0, why: 'Le variateur redresse le réseau, puis l’onduleur recrée un alternatif de fréquence et de tension réglables pour le moteur.' }
  ]
};
function initQcm() {
  $$('[data-qcm]').forEach(boxEl => {
    const key = boxEl.dataset.qcm, items = QCM[key]; if (!items) return;
    boxEl.innerHTML = items.map((it, i) => `<div class="qq"><p>${i + 1}. ${it.q}</p>${it.o.map((o, j) => `<label><input type="radio" name="${key}-${i}" value="${j}"> ${o}</label>`).join('')}<div class="why">${it.why}</div></div>`).join('') + '<div class="score"></div>';
    const qs = $$('.qq', boxEl), score = $('.score', boxEl), done = {};
    const upd = () => { const n = Object.keys(done).length, good = Object.values(done).filter(Boolean).length;
      score.innerHTML = n < qs.length ? `Réponses : ${n} / ${qs.length}` : `<b>Score : ${good} / ${qs.length}</b> ${good === qs.length ? '— Bravo, c’est acquis.' : '— Relis les explications en vert/violet et recommence.'} <button type="button">Recommencer</button>`;
      const b = $('button', score); if (b) b.onclick = () => { for (const k in done) delete done[k]; qs.forEach(q => { q.classList.remove('ok', 'no'); $$('input', q).forEach(i => { i.checked = false; i.disabled = false; }); $$('label', q).forEach(l => l.classList.remove('good', 'bad')); }); upd(); }; };
    qs.forEach((q, i) => $$('input', q).forEach(inp => inp.addEventListener('change', () => {
      const ok = +inp.value === items[i].a; done[i] = ok; q.classList.toggle('ok', ok); q.classList.toggle('no', !ok);
      $$('input', q).forEach(x => { x.disabled = true; const l = x.closest('label'); if (+x.value === items[i].a) l.classList.add('good'); else if (x === inp) l.classList.add('bad'); });
      upd();
    })));
    upd();
  });
}
document.addEventListener('DOMContentLoaded', () => { initQcm(); requestAnimationFrame(loop); });
