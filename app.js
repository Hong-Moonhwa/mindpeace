'use strict';

const EMOTIONS = [
  { id: '기본',   icon: '🪷' },
  { id: '슬픔',   icon: '😢' },
  { id: '우울',   icon: '🌧️' },
  { id: '아픔',   icon: '💔' },
  { id: '화남',   icon: '🔥' },
  { id: '즐거움', icon: '☀️' },
];

let quotes      = [];
let emotion     = '기본';
let recentIds   = [];
let animating   = false;

const $card    = document.getElementById('quoteCard');
const $text    = document.getElementById('quoteText');
const $source  = document.getElementById('quoteSource');
const $bar     = document.getElementById('emotionBar');
const $refresh = document.getElementById('refreshBtn');

/* ── Boot ──────────────────────────────── */
async function init() {
  try {
    const r = await fetch('quotes.json');
    quotes = await r.json();
  } catch {
    $text.textContent = '데이터를 불러올 수 없습니다.';
    return;
  }
  renderChips();
  display();
}

/* ── Quote selection ────────────────────── */
function pool() {
  const filtered = quotes.filter(q => q.emotions.includes(emotion));
  const avail    = filtered.filter(q => !recentIds.includes(q.id));
  return avail.length ? avail : filtered;
}

function pick() {
  const p = pool();
  return p[Math.floor(Math.random() * p.length)];
}

function display(animate = false) {
  const q = pick();
  if (!q) return;

  recentIds.push(q.id);
  if (recentIds.length > 3) recentIds.shift();

  if (!animate) { render(q); return; }
  if (animating) return;

  animating = true;
  $card.classList.add('fade-out');
  setTimeout(() => {
    render(q);
    $card.classList.remove('fade-out');
    setTimeout(() => { animating = false; }, 250);
  }, 220);
}

function render(q) {
  $text.textContent = q.text;
  if (q.source) {
    $source.textContent = '— ' + q.source + ' —';
    $source.style.display = 'block';
  } else {
    $source.style.display = 'none';
  }
}

/* ── Emotion chips ──────────────────────── */
function renderChips() {
  $bar.innerHTML = '';
  EMOTIONS.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (em.id === emotion ? ' active' : '');
    btn.setAttribute('aria-pressed', em.id === emotion ? 'true' : 'false');
    btn.textContent = em.icon + ' ' + em.id;
    btn.addEventListener('click', () => {
      if (em.id === emotion) return;
      emotion   = em.id;
      recentIds = [];
      renderChips();
      display(true);
    });
    $bar.appendChild(btn);
  });
}

/* ── Refresh button ─────────────────────── */
$refresh.addEventListener('click', () => {
  if (animating) return;
  $refresh.classList.add('spinning');
  setTimeout(() => $refresh.classList.remove('spinning'), 450);
  display(true);
});

/* ── Pull-to-refresh (swipe up) ─────────── */
let ty0 = 0;
let tt0 = 0;
const $hint = document.createElement('div');
$hint.className = 'ptr-hint';
$hint.textContent = '↑ 위로 스와이프하면 새 말씀';
document.body.appendChild($hint);

document.addEventListener('touchstart', e => {
  ty0 = e.touches[0].clientY;
  tt0 = Date.now();
}, { passive: true });

document.addEventListener('touchmove', e => {
  const dy = ty0 - e.touches[0].clientY;
  if (dy > 40) $hint.classList.add('show');
  else          $hint.classList.remove('show');
}, { passive: true });

document.addEventListener('touchend', e => {
  $hint.classList.remove('show');
  const dy = ty0 - e.changedTouches[0].clientY;
  const dt = Date.now() - tt0;
  if (dy > 80 && dt < 600 && !animating) display(true);
}, { passive: true });

/* ── Service Worker ─────────────────────── */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
