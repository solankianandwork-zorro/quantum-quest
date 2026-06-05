/* ============================================================
   app.js — makes Grand Line Quantum interactive (One Piece theme)
   Navigation • Log Pose progress • widgets • crew quizzes
   Same quantum engine + logic as Quantum Quest, pirate reskin.
   ============================================================ */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const lessons = $$('.lesson');
  const TOTAL = lessons.length;

  // ---------- progress storage (safe even on file://) ----------
  const KEY = 'grand-line-quantum-progress';
  function loadDone() {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveDone(set) {
    try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch (e) {}
  }
  let done = loadDone();

  // ---------- build sidebar nav ----------
  const nav = $('#nav');
  lessons.forEach((sec, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.dataset.idx = i;
    btn.innerHTML = `<span class="dot" data-dot="${i}"></span>
                     <span>${sec.dataset.icon || '•'} ${sec.dataset.title || ('Island ' + i)}</span>`;
    btn.addEventListener('click', () => goTo(i));
    li.appendChild(btn);
    nav.appendChild(li);
  });

  function refreshProgress() {
    done.forEach(i => {
      const dot = $(`[data-dot="${i}"]`);
      if (dot) { dot.classList.add('done'); dot.textContent = '✓'; }
    });
    $$('[data-dot]').forEach(d => { if (!done.has(+d.dataset.dot)) { d.classList.remove('done'); d.textContent = ''; } });
    const pct = Math.round((done.size / TOTAL) * 100);
    $('#progressFill').style.width = pct + '%';
    $('#progressLabel').textContent = pct + '% complete';
    const cert = $('#certLine');
    if (cert) {
      if (done.size >= TOTAL) cert.innerHTML = '🏴‍☠️ <b>Unlocked!</b> You claimed the Quantum One Piece. Official rank: <b>Quantum Pirate King</b>. Now go build something legendary!';
      else cert.textContent = `Clear all islands to unlock your bounty poster! (${done.size}/${TOTAL} cleared)`;
    }
  }

  function markDone(i) { done.add(i); saveDone(done); refreshProgress(); }

  // ---------- navigation ----------
  let current = 0;
  function goTo(i) {
    i = Math.max(0, Math.min(TOTAL - 1, i));
    lessons.forEach((s, k) => s.classList.toggle('active', k === i));
    $$('#nav button').forEach(b => b.classList.toggle('active', +b.dataset.idx === i));
    current = i;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // prev/next/finish buttons inside lessons
  $$('.nextBtn').forEach(b => b.addEventListener('click', () => { markDone(current); goTo(current + 1); }));
  $$('.prevBtn').forEach(b => b.addEventListener('click', () => goTo(current - 1)));
  const finishBtn = $('#finishBtn');
  if (finishBtn) finishBtn.addEventListener('click', () => {
    markDone(current); refreshProgress(); treasureRain();
    setTimeout(() => alert('🏴‍☠️ Congratulations, Captain! You found the Quantum One Piece!\n\nYou are now a Quantum Pirate King. Tell Claude which project you want to build first!'), 250);
  });

  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Scuttle the whole voyage and start over?')) { done = new Set(); saveDone(done); refreshProgress(); }
  });

  // ---------- treasure confetti (dynamic victory effect) ----------
  function treasureRain() {
    const loot = ['🪙', '💰', '🏴‍☠️', '👑', '💎', '🍖'];
    for (let i = 0; i < 44; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.textContent = loot[i % loot.length];
      piece.style.left = Math.round((i * 97) % 100) + 'vw';      // spread without Math.random
      piece.style.animationDuration = (2.4 + (i % 5) * 0.5) + 's';
      piece.style.animationDelay = ((i % 11) * 0.12) + 's';
      piece.style.fontSize = (18 + (i % 4) * 7) + 'px';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 7000);
    }
  }

  // ============================================================
  //  Small UI helpers
  // ============================================================
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function renderBars(container, labels, probs) {
    container.innerHTML = '';
    const wrap = el('div', 'bars');
    labels.forEach((lab, i) => {
      const pct = Math.round(probs[i] * 100);
      const row = el('div', 'bar-row');
      row.appendChild(el('div', 'bar-label', '|' + lab + '⟩'));
      const track = el('div', 'bar-track');
      const fill = el('div', 'bar-fill');
      fill.style.width = pct + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div', 'bar-pct', pct + '%'));
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
  }

  function renderHist(container, keys, counts) {
    container.innerHTML = '';
    const max = Math.max(1, ...keys.map(k => counts[k] || 0));
    const hist = el('div', 'hist');
    keys.forEach(k => {
      const col = el('div', 'col');
      const stick = el('div', 'stick');
      stick.style.height = ((counts[k] || 0) / max * 100) + '%';
      col.appendChild(stick);
      col.appendChild(el('div', 'cap', `|${k}⟩\n${counts[k] || 0}`));
      hist.appendChild(col);
    });
    container.appendChild(hist);
  }

  // ============================================================
  //  WIDGET 1 — classic bit (a Marine Den Den Mushi signal)
  // ============================================================
  (function () {
    const host = $('#w-bit'); if (!host) return;
    let on = false;
    host.innerHTML = `<h4>📡 A Marine Den Den Mushi (classic bit)</h4>
      <div style="font-size:60px" id="bitIcon">😴</div>
      <div class="btnrow"><button class="btn" id="bitToggle">Toggle the signal</button></div>
      <div class="readout" id="bitOut">The snail is ASLEEP → value = 0</div>`;
    const icon = $('#bitIcon', host), out = $('#bitOut', host);
    $('#bitToggle', host).addEventListener('click', () => {
      on = !on;
      icon.textContent = on ? '📡' : '😴';
      out.textContent = on ? 'The snail is AWAKE → value = 1' : 'The snail is ASLEEP → value = 0';
    });
  })();

  // ============================================================
  //  WIDGET 2 — qubit (a spinning Devil Fruit Berry)
  // ============================================================
  (function () {
    const host = $('#w-coin'); if (!host) return;
    let spinning = false, tally = { 0: 0, 1: 0 };
    host.innerHTML = `<h4>🪙 A Devil Fruit Berry (qubit)</h4>
      <div><span class="coin" id="coin">🪙</span></div>
      <div class="btnrow">
        <button class="btn" id="spinBtn">🌀 Spin (awaken)</button>
        <button class="btn ghost" id="measBtn">👁️ Observe</button>
      </div>
      <div class="readout" id="coinOut">Press “Spin” to awaken the Berry into superposition, then “Observe”.</div>`;
    const coin = $('#coin', host), out = $('#coinOut', host);
    $('#spinBtn', host).addEventListener('click', () => {
      spinning = true; coin.classList.add('spin'); coin.textContent = '🪙';
      out.textContent = 'The Berry is spinning… it is 0 AND 1 at the same time! Now observe it.';
    });
    $('#measBtn', host).addEventListener('click', () => {
      if (!spinning) { out.textContent = 'Spin it first, Captain! 🙂'; return; }
      spinning = false; coin.classList.remove('spin');
      const q = new Q.QState(1); q.applySingle(Q.GATES.H, 0);
      const r = q.measure();
      tally[r]++;
      coin.textContent = r === 0 ? '0️⃣' : '1️⃣';
      out.textContent = `You observed: ${r}!  (so far → 0: ${tally[0]} times, 1: ${tally[1]} times)\nIt's random — but over many tries it settles to about 50/50.`;
    });
  })();

  // ============================================================
  //  WIDGET 3 — superposition slider (Devil Fruit lean)
  // ============================================================
  (function () {
    const host = $('#w-super'); if (!host) return;
    host.innerHTML = `<h4>🌗 Choose your Devil Fruit's lean</h4>
      <label>Chance of observing <b>1</b>: <b id="supVal">50</b>%</label>
      <input id="supSlider" type="range" min="0" max="100" value="50" style="width:100%">
      <div id="supBars"></div>
      <div class="btnrow"><button class="btn" id="sup100">🎲 Observe 100 times</button></div>
      <div id="supHist"></div>`;
    const slider = $('#supSlider', host), val = $('#supVal', host);
    function update() {
      const p1 = (+slider.value) / 100, p0 = 1 - p1;
      val.textContent = slider.value;
      renderBars($('#supBars', host), ['0', '1'], [p0, p1]);
    }
    slider.addEventListener('input', update); update();
    $('#sup100', host).addEventListener('click', () => {
      const p1 = (+slider.value) / 100;
      const counts = new Q.QState(1).prepare1(p1).sample(100);
      renderHist($('#supHist', host), ['0', '1'], counts);
    });
  })();

  // ============================================================
  //  WIDGET 4 — measurement collapse (Observation Haki)
  // ============================================================
  (function () {
    const host = $('#w-measure'); if (!host) return;
    host.innerHTML = `<h4>👁️ Observation Haki — collapse</h4>
      <div id="mBars"></div>
      <div class="btnrow">
        <button class="btn" id="mMeasure">👁️ Observe</button>
        <button class="btn ghost" id="mReset">↺ Reset to 50/50</button>
      </div>
      <div class="readout" id="mOut">This qubit is a perfect 50/50 mix. Observe it!</div>`;
    let q;
    function reset() {
      q = new Q.QState(1); q.applySingle(Q.GATES.H, 0);
      renderBars($('#mBars', host), ['0', '1'], q.probabilities());
      $('#mOut', host).textContent = 'This qubit is a perfect 50/50 mix. Observe it!';
    }
    $('#mMeasure', host).addEventListener('click', () => {
      const r = q.measure();
      renderBars($('#mBars', host), ['0', '1'], q.probabilities());
      $('#mOut', host).textContent = `Collapsed to ${r}! Now it's locked at ${r} — observe again and you'll keep getting ${r}. Press Reset to restore the mix.`;
    });
    $('#mReset', host).addEventListener('click', reset);
    reset();
  })();

  // ============================================================
  //  WIDGET 5 — single-qubit gate playground (combat moves)
  // ============================================================
  (function () {
    const host = $('#w-gates'); if (!host) return;
    host.innerHTML = `<h4>⚔️ Combat-move playground</h4>
      <div class="btnrow">
        <button class="btn gate" data-g="X">X</button>
        <button class="btn gate" data-g="H">H</button>
        <button class="btn gate" data-g="Z">Z</button>
        <button class="btn ghost small" id="gMeasure">👁️ Observe</button>
        <button class="btn ghost small" id="gReset">↺ Reset</button>
      </div>
      <div id="gBars"></div>
      <div class="readout" id="gOut"></div>`;
    let q, history = [];
    function show() {
      renderBars($('#gBars', host), ['0', '1'], q.probabilities());
      const a = q.amps;
      $('#gOut', host).textContent =
        `Moves used: ${history.join(' → ') || '(none yet — start at |0⟩)'}\n` +
        `amplitudes:  0: ${fmt(a[0])}   1: ${fmt(a[1])}`;
    }
    function fmt(c) { const r = c.re.toFixed(2), i = c.im.toFixed(2); return Math.abs(c.im) < 1e-9 ? r : `${r}${c.im >= 0 ? '+' : ''}${i}i`; }
    function reset() { q = new Q.QState(1); history = []; show(); }
    $$('.gate', host).forEach(b => b.addEventListener('click', () => {
      const g = b.dataset.g; q.applySingle(Q.GATES[g], 0); history.push(g); show();
    }));
    $('#gMeasure', host).addEventListener('click', () => {
      const r = q.measure(); history.push('Observe=' + r); show();
    });
    $('#gReset', host).addEventListener('click', reset);
    reset();
  })();

  // ============================================================
  //  WIDGET 6 — Bloch sphere (the Log Pose globe)
  // ============================================================
  (function () {
    const host = $('#w-bloch'); if (!host) return;
    host.innerHTML = `<h4>🧭 The Log Pose Globe</h4>
      <canvas id="bloch" width="320" height="320"></canvas>
      <div class="btnrow">
        <button class="btn gate" data-g="X">X</button>
        <button class="btn gate" data-g="H">H</button>
        <button class="btn gate" data-g="Z">Z</button>
        <button class="btn gate" data-g="Y">Y</button>
        <button class="btn gate" data-g="S">S</button>
        <button class="btn ghost small" id="bReset">↺ Reset</button>
      </div>`;
    const cv = $('#bloch', host), ctx = cv.getContext('2d');
    let q;
    const CX = 160, CY = 160, R = 120;
    function draw() {
      ctx.clearRect(0, 0, 320, 320);
      // globe outline
      ctx.strokeStyle = '#1d5d83'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.stroke();
      // equator (squished ellipse)
      ctx.beginPath(); ctx.ellipse(CX, CY, R, R * 0.35, 0, 0, 7); ctx.stroke();
      // vertical axis
      ctx.beginPath(); ctx.moveTo(CX, CY - R); ctx.lineTo(CX, CY + R); ctx.stroke();
      // labels
      ctx.fillStyle = '#bcd9ea'; ctx.font = '14px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.fillText('|0⟩ (North)', CX, CY - R - 8);
      ctx.fillText('|1⟩ (South)', CX, CY + R + 18);
      // compass needle (arrow)
      const v = Q.blochVector(q);            // x,y,z each -1..1
      const px = CX + v.x * R;               // project: x → screen x
      const py = CY - v.z * R + v.y * R * 0.35; // z → up, y → depth tilt
      ctx.strokeStyle = '#ffcf4d'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#e23b3b'; ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#062132'; ctx.beginPath(); ctx.arc(CX, CY, 4, 0, 7); ctx.fill();
    }
    function reset() { q = new Q.QState(1); draw(); }
    $$('.gate', host).forEach(b => b.addEventListener('click', () => { q.applySingle(Q.GATES[b.dataset.g], 0); draw(); }));
    $('#bReset', host).addEventListener('click', reset);
    reset();
  })();

  // ============================================================
  //  WIDGET 7 — entanglement (two bonded nakama / Bell pair)
  // ============================================================
  (function () {
    const host = $('#w-bell'); if (!host) return;
    host.innerHTML = `<h4>🤝 Two bonded nakama (Bell pair)</h4>
      <div class="btnrow">
        <button class="btn" id="bellMeasure">👁️ Observe both</button>
        <button class="btn ghost small" id="bellReset">↺ New pair</button>
      </div>
      <div class="readout" id="bellOut"></div>
      <div id="bellHist"></div>`;
    let counts = { '00': 0, '01': 0, '10': 0, '11': 0 };
    function fresh() { const q = new Q.QState(2); q.applySingle(Q.GATES.H, 0); q.applyCNOT(0, 1); return q; }
    function refresh() { renderHist($('#bellHist', host), ['00', '01', '10', '11'], counts); }
    $('#bellMeasure', host).addEventListener('click', () => {
      const q = fresh();
      const r = q.measure();
      const s = q.bitstring(r);
      counts[s]++;
      $('#bellOut', host).textContent =
        `Crewmate A = ${s[0]},  Crewmate B = ${s[1]}  →  they MATCH! 🎉\n` +
        `Notice: you only ever see 00 or 11, never 01 or 10. The nakama are bonded.`;
      refresh();
    });
    $('#bellReset', host).addEventListener('click', () => { counts = { '00': 0, '01': 0, '10': 0, '11': 0 }; $('#bellOut', host).textContent = ''; refresh(); });
    refresh();
  })();

  // ============================================================
  //  WIDGET 8 — circuit builder (battle formation, 2 qubits, 5 columns)
  // ============================================================
  (function () {
    const host = $('#w-circuit'); if (!host) return;
    const COLS = 5, ROWS = 2;
    const CYCLE = ['', 'H', 'X', 'Z', 'C'];     // empty → H → X → Z → control
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(''));

    const table = el('table', 'grid');
    for (let r = 0; r < ROWS; r++) {
      const tr = el('tr');
      tr.appendChild(el('td', 'wirelabel', `q${r} |0⟩—`));
      for (let c = 0; c < COLS; c++) {
        const td = el('td');
        const cell = el('div', 'cell');
        cell.dataset.r = r; cell.dataset.c = c;
        cell.addEventListener('click', () => {
          const cur = grid[r][c];
          const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
          grid[r][c] = next;
          paint(cell, next);
        });
        td.appendChild(cell);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    function paint(cell, v) {
      cell.className = 'cell' + (v ? ' filled ' + (v === 'C' ? 'C' : v) : '');
      cell.textContent = v === 'C' ? '•' : v;
    }

    host.innerHTML = '<h4>🧩 Plan & run a battle formation</h4>' +
      '<p style="color:#bcd9ea;margin:0 0 8px">Click cells to cycle: empty → H → X → Z → • (CNOT control). A • links to the other crewmate in that column.</p>';
    host.appendChild(table);
    const controls = el('div', 'btnrow',
      '<button class="btn" id="runBtn">▶ Run (1000 shots)</button>' +
      '<button class="btn ghost small" id="clrBtn">🗑️ Clear</button>');
    host.appendChild(controls);
    const out = el('div', 'readout'); out.id = 'circOut'; out.textContent = 'Plan a formation, then press Run!';
    host.appendChild(out);
    const barsBox = el('div'); host.appendChild(barsBox);
    const histBox = el('div'); host.appendChild(histBox);

    function run() {
      const q = new Q.QState(2);
      const steps = [];
      for (let c = 0; c < COLS; c++) {
        // single-qubit gates first
        for (let r = 0; r < ROWS; r++) {
          const g = grid[r][c];
          if (g === 'H' || g === 'X' || g === 'Z') { q.applySingle(Q.GATES[g], r); steps.push(`${g} on q${r}`); }
        }
        // then CNOT if a control exists in this column
        for (let r = 0; r < ROWS; r++) {
          if (grid[r][c] === 'C') { const t = (r + 1) % ROWS; q.applyCNOT(r, t); steps.push(`CNOT q${r}→q${t}`); }
        }
      }
      renderBars(barsBox, ['00', '01', '10', '11'], q.probabilities());
      renderHist(histBox, ['00', '01', '10', '11'], q.sample(1000));
      out.textContent = 'Formation: ' + (steps.join('  →  ') || '(empty)') + '\nResults of 1000 observations below ⬇️';
    }
    $('#runBtn', host).addEventListener('click', run);
    $('#clrBtn', host).addEventListener('click', () => {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { grid[r][c] = ''; }
      $$('.cell', host).forEach(c => paint(c, ''));
      barsBox.innerHTML = ''; histBox.innerHTML = ''; out.textContent = 'Cleared. Plan a new formation!';
    });
  })();

  // ============================================================
  //  WIDGET 9 — interference demo (the secret combo: H then H)
  // ============================================================
  (function () {
    const host = $('#w-interference'); if (!host) return;
    let counts = { 0: 0, 1: 0 };
    host.innerHTML = `<h4>🌊 The "always 0" combo (H → H)</h4>
      <div class="btnrow">
        <button class="btn" id="intRun">▶ Run once</button>
        <button class="btn" id="intRun100">▶ Run 100 times</button>
        <button class="btn ghost small" id="intReset">↺ Reset</button>
      </div>
      <div class="readout" id="intOut">A normal Berry flipped twice is still random. A quantum Berry H-ed twice is ALWAYS 0. Try it!</div>
      <div id="intHist"></div>`;
    function once() { const q = new Q.QState(1); q.applySingle(Q.GATES.H, 0); q.applySingle(Q.GATES.H, 0); return q.measure(); }
    function refresh() { renderHist($('#intHist', host), ['0', '1'], counts); }
    $('#intRun', host).addEventListener('click', () => { counts[once()]++; refresh(); $('#intOut', host).textContent = `Result: 0 every time. The "1" waves cancelled out! (totals → 0:${counts[0]}, 1:${counts[1]})`; });
    $('#intRun100', host).addEventListener('click', () => { for (let i = 0; i < 100; i++) counts[once()]++; refresh(); $('#intOut', host).textContent = `Ran 100 times. Still 0 every single time → 0:${counts[0]}, 1:${counts[1]}. That's interference!`; });
    $('#intReset', host).addEventListener('click', () => { counts = { 0: 0, 1: 0 }; refresh(); });
    refresh();
  })();

  // ============================================================
  //  CREW QUIZZES
  // ============================================================
  const QUIZZES = {
    1: [
      { q: 'A normal bit can be…', opts: ['Only 0 or only 1', 'Both 0 and 1 at once', 'Any colour'], a: 0, why: 'A classic bit is like a Den Den Mushi lamp — only asleep (0) or awake (1).' },
      { q: 'A qubit BEFORE you observe it is like…', opts: ['A snail stuck awake', 'A spinning Berry (a mix of 0 and 1)', 'A broken bit'], a: 1, why: 'Before observing, a qubit can be a mix — the spinning Berry!' },
    ],
    2: [
      { q: 'Superposition (awakening) means a qubit is…', opts: ['Definitely 0', 'A mix of 0 and 1 with certain probabilities', 'Faster than a bit'], a: 1, why: 'Superposition = a blend of 0 and 1, each with some chance.' },
      { q: 'If a qubit is 50/50 and you observe it once, you get…', opts: ['Always 0', 'Half a 0', 'Randomly 0 or 1'], a: 2, why: 'One observation is random; only over many tries do you see ~50/50.' },
    ],
    3: [
      { q: 'What happens when you observe a qubit?', opts: ['Nothing changes', 'It collapses to one definite value', 'It speeds up'], a: 1, why: 'Observation Haki collapses the superposition to a single value.' },
      { q: 'After a qubit collapses to 1, observing again gives…', opts: ['1 again', 'A random value', '0'], a: 0, why: 'Once collapsed, it stays put until you change it.' },
    ],
    4: [
      { q: 'Which move makes a 50/50 superposition from |0⟩?', opts: ['X', 'H', 'Z'], a: 1, why: 'H (Hadamard) — the "Mixer" — turns 0 into a 50/50 mix.' },
      { q: 'The X move…', opts: ['Flips 0↔1', 'Observes the qubit', 'Deletes it'], a: 0, why: 'X is the flip/NOT move.' },
    ],
    5: [
      { q: 'On the Log Pose globe, the North Pole means…', opts: ['Definitely 1', 'Definitely 0', 'A 50/50 mix'], a: 1, why: 'North = |0⟩, South = |1⟩, equator = mix.' },
      { q: 'Combat moves basically…', opts: ['Rotate the needle on the globe', 'Erase the qubit', 'Add more qubits'], a: 0, why: 'Every gate is just a rotation of the Bloch needle.' },
    ],
    6: [
      { q: 'Bonded (entangled) nakama qubits…', opts: ['Never affect each other', 'Are linked — observing one tells you about the other', 'Are just two normal bits'], a: 1, why: 'That\'s the "spooky" bond Einstein worried about.' },
      { q: 'Can you send a message faster than light with entanglement?', opts: ['Yes, instantly', 'No — each result is random', 'Only on Tuesdays'], a: 1, why: 'No real signal travels; you only see the bond when comparing results.' },
    ],
    7: [
      { q: 'A quantum circuit (battle formation) is read…', opts: ['Right to left', 'Left to right, like a battle plan', 'Top to bottom'], a: 1, why: 'Qubits sail along wires from left to right.' },
      { q: 'H on q0 then CNOT(q0→q1) creates…', opts: ['A random number', 'A bonded Bell pair', 'A dead qubit'], a: 1, why: 'That exact recipe forges the famous Bell pair.' },
    ],
    8: [
      { q: 'Interference lets a quantum computer…', opts: ['Make wrong answers cancel and right answers grow', 'Run hotter', 'Use more electricity'], a: 0, why: 'Cancel the wrong, amplify the right — the core combo.' },
      { q: 'H then H on |0⟩ gives…', opts: ['Random 0 or 1', 'Always 0 (waves cancel)', 'Always 1'], a: 1, why: 'The two mixers interfere and undo each other.' },
    ],
    9: [
      { q: 'Which free tool do we use to write real quantum code?', opts: ['Qiskit', 'Photoshop', 'Excel'], a: 0, why: 'Qiskit is IBM\'s free Python quantum toolkit.' },
      { q: 'Can you run code on a REAL quantum computer for free?', opts: ['No, never', 'Yes — via IBM Quantum over the internet', 'Only if you own one'], a: 1, why: 'IBM Quantum gives free cloud access to real machines.' },
    ],
  };

  $$('.quiz').forEach(box => {
    const id = box.dataset.quiz;
    const questions = QUIZZES[id]; if (!questions) return;
    box.appendChild(el('h2', null, '🏴‍☠️ Crew Quiz'));
    questions.forEach((item) => {
      const card = el('div');
      card.appendChild(el('div', 'q', item.q));
      const fb = el('div', 'feedback');
      const optBtns = [];
      item.opts.forEach((text, oi) => {
        const o = el('button', 'opt', text);
        o.addEventListener('click', () => {
          if (o.disabled) return;
          optBtns.forEach(b => b.disabled = true);
          if (oi === item.a) { o.classList.add('correct'); fb.className = 'feedback ok'; fb.textContent = '✅ Correct! ' + item.why; }
          else {
            o.classList.add('wrong'); optBtns[item.a].classList.add('correct');
            fb.className = 'feedback no'; fb.textContent = '❌ Not quite. ' + item.why;
          }
        });
        optBtns.push(o); card.appendChild(o);
      });
      card.appendChild(fb);
      box.appendChild(card);
    });
  });

  // ---------- keyboard arrows for navigation ----------
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'ArrowLeft') goTo(current - 1);
  });

  // ---------- set sail! ----------
  refreshProgress();
  goTo(0);
})();
