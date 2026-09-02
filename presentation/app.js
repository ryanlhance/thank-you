(function () {
  const TOTAL = 23;
  const slideImg = document.getElementById('slide');
  const counter = document.getElementById('counter');
  const titleEl = document.getElementById('slide-title');
  const notesEl = document.getElementById('notes');
  const notesBody = document.getElementById('notes-body');
  const notesToggle = document.getElementById('notes-toggle');
  const gridEl = document.getElementById('grid');
  const gridToggle = document.getElementById('grid-toggle');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  let notes = [];
  let cur = 1;

  const src = n => `./slides/${String(n).padStart(2, '0')}.jpg`;
  const clamp = n => Math.min(TOTAL, Math.max(1, n));

  function render() {
    slideImg.src = src(cur);
    slideImg.alt = (notes[cur - 1] && notes[cur - 1].title) ? `Slide ${cur}: ${notes[cur - 1].title}` : `Slide ${cur}`;
    counter.textContent = `${cur} / ${TOTAL}`;
    titleEl.textContent = (notes[cur - 1] && notes[cur - 1].title) || '';
    prev.disabled = cur === 1;
    next.disabled = cur === TOTAL;
    const n = notes[cur - 1];
    notesBody.innerHTML = '';
    if (n && n.notes && n.notes.trim()) {
      n.notes.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(line => {
        const p = document.createElement('p'); p.textContent = line; notesBody.appendChild(p);
      });
    } else {
      const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'No notes for this slide.'; notesBody.appendChild(p);
    }
    notesBody.scrollTop = 0;
    [cur + 1, cur - 1].forEach(k => { if (k >= 1 && k <= TOTAL) { const i = new Image(); i.src = src(k); } });
    if (history.replaceState) history.replaceState(null, '', `#${cur}`);
    gridEl.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('current', i + 1 === cur));
  }
  function go(n) { const c = clamp(n); if (c !== cur) { cur = c; render(); } }

  function setNotes(on) {
    notesEl.hidden = !on;
    notesToggle.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('epam-prez-notes', on ? '1' : '0'); } catch (e) {}
  }
  function setGrid(on) {
    gridEl.hidden = !on;
    gridToggle.setAttribute('aria-pressed', String(on));
    if (on) { const c = gridEl.querySelector('.thumb.current'); if (c) c.scrollIntoView({ block: 'center' }); }
  }

  function buildGrid() {
    gridEl.innerHTML = '';
    for (let i = 1; i <= TOTAL; i++) {
      const b = document.createElement('button'); b.className = 'thumb'; b.type = 'button';
      const img = document.createElement('img'); img.src = src(i); img.loading = 'lazy'; img.alt = '';
      const s = document.createElement('span'); s.textContent = `${i}. ${(notes[i - 1] && notes[i - 1].title) || ''}`;
      b.appendChild(img); b.appendChild(s);
      b.addEventListener('click', () => { go(i); setGrid(false); });
      gridEl.appendChild(b);
    }
  }

  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  notesToggle.addEventListener('click', () => setNotes(notesEl.hidden));
  document.getElementById('notes-close').addEventListener('click', () => setNotes(false));
  gridToggle.addEventListener('click', () => setGrid(gridEl.hidden));
  gridEl.addEventListener('click', e => { if (e.target === gridEl) setGrid(false); });
  document.getElementById('fs-toggle').addEventListener('click', () => {
    const w = document.getElementById('stage-wrap');
    if (document.fullscreenElement) document.exitFullscreen(); else if (w.requestFullscreen) w.requestFullscreen();
  });
  slideImg.addEventListener('click', () => go(cur + 1));
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': e.preventDefault(); go(cur + 1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); go(cur - 1); break;
      case 'Home': go(1); break;
      case 'End': go(TOTAL); break;
      case 'n': case 'N': setNotes(notesEl.hidden); break;
      case 'g': case 'G': setGrid(gridEl.hidden); break;
      case 'Escape': if (!gridEl.hidden) setGrid(false); break;
    }
  });
  // touch swipe
  let tx = null;
  document.getElementById('frame').addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  document.getElementById('frame').addEventListener('touchend', e => {
    if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('hashchange', () => { const h = parseInt(location.hash.slice(1), 10); if (h) go(h); });

  const h = parseInt(location.hash.slice(1), 10);
  if (h) cur = clamp(h);
  let wantNotes = false;
  try { wantNotes = localStorage.getItem('epam-prez-notes') === '1'; } catch (e) {}
  setNotes(wantNotes);
  render();
  fetch('./notes.json').then(r => r.json()).then(d => { notes = d; buildGrid(); render(); }).catch(() => { buildGrid(); });
})();
