/* ============================================================
   app.js — makes Quantum Quest interactive
   Navigation • progress • widgets • quizzes
   ============================================================ */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const lessons = $$('.lesson');
  const TOTAL = lessons.length;

  // ---------- progress storage (safe even on file://) ----------
  const KEY = 'quantum-quest-progress';
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
                     <span>${sec.dataset.icon || '•'} ${sec.dataset.title || ('Lesson ' + i)}</span>`;
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
      if (done.size >= TOTAL) cert.innerHTML = '🏅 <b>Unlocked!</b> You completed Quantum Quest. Official rank: <b>Junior Quantum Engineer</b>. Go build something amazing!';
      else cert.textContent = `Finish all lessons to unlock your certificate! (${done.size}/${TOTAL} done)`;
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
  if (finishBtn) finishBtn.addEventListener('click', () => { markDone(current); refreshProgress(); alert('🎉 Congratulations! You finished Quantum Quest!\n\nYou are now a Junior Quantum Engineer. Tell Claude which project you want to build first!'); });

  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Reset all your progress?')) { done = new Set(); saveDone(done); refreshProgress(); }
  });

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
  //  WIDGET 1 — classic bit (light switch)
  // ============================================================
  (function () {
    const host = $('#w-bit'); if (!host) return;
    let on = false;
    host.innerHTML = `<h4>💡 A classic bit</h4>
      <div style="font-size:60px" id="bitIcon">💡</div>
      <div class="btnrow"><button class="btn" id="bitToggle">Flip the switch</button></div>
      <div class="readout" id="bitOut">The bit is OFF → value = 0</div>`;
    const icon = $('#bitIcon', host), out = $('#bitOut', host);
    $('#bitToggle', host).addEventListener('click', () => {
      on = !on;
      icon.textContent = on ? '🔆' : '💡';
      out.textContent = on ? 'The bit is ON → value = 1' : 'The bit is OFF → value = 0';
    });
  })();

  // ============================================================
  //  WIDGET 2 — quantum coin (spin + measure)
  // ============================================================
  (function () {
    const host = $('#w-coin'); if (!host) return;
    let spinning = false, tally = { 0: 0, 1: 0 };
    host.innerHTML = `<h4>🪙 A qubit coin</h4>
      <div><span class="coin" id="coin">🪙</span></div>
      <div class="btnrow">
        <button class="btn" id="spinBtn">🌀 Spin (superposition)</button>
        <button class="btn ghost" id="measBtn">👁️ Measure</button>
      </div>
      <div class="readout" id="coinOut">Press “Spin” to put the coin into superposition, then “Measure”.</div>`;
    const coin = $('#coin', host), out = $('#coinOut', host);
    $('#spinBtn', host).addEventListener('click', () => {
      spinning = true; coin.classList.add('spin'); coin.textContent = '🪙';
      out.textContent = 'The coin is spinning… it is 0 AND 1 at the same time! Now measure it.';
    });
    $('#measBtn', host).addEventListener('click', () => {
      if (!spinning) { out.textContent = 'Spin it first! 🙂'; return; }
      spinning = false; coin.classList.remove('spin');
      const q = new Q.QState(1); q.applySingle(Q.GATES.H, 0);
      const r = q.measure();
      tally[r]++;
      coin.textContent = r === 0 ? '⬆️' : '⬇️';
      out.textContent = `You measured: ${r}!  (so far → 0: ${tally[0]} times, 1: ${tally[1]} times)\nNotice it's random — but over many tries it's about 50/50.`;
    });
  })();

  // ============================================================
  //  WIDGET 3 — superposition slider
  // ============================================================
  (function () {
    const host = $('#w-super'); if (!host) return;
    host.innerHTML = `<h4>🌗 Choose the qubit's lean</h4>
      <label>Chance of measuring <b>1</b>: <b id="supVal">50</b>%</label>
      <input id="supSlider" type="range" min="0" max="100" value="50" style="width:100%">
      <div id="supBars"></div>
      <div class="btnrow"><button class="btn" id="sup100">🎲 Measure 100 times</button></div>
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
  //  WIDGET 4 — measurement collapse
  // ============================================================
  (function () {
    const host = $('#w-measure'); if (!host) return;
    host.innerHTML = `<h4>👁️ Measure & collapse</h4>
      <div id="mBars"></div>
      <div class="btnrow">
        <button class="btn" id="mMeasure">👁️ Measure</button>
        <button class="btn ghost" id="mReset">↺ Reset to 50/50</button>
      </div>
      <div class="readout" id="mOut">This qubit is a perfect 50/50 mix. Measure it!</div>`;
    let q;
    function reset() {
      q = new Q.QState(1); q.applySingle(Q.GATES.H, 0);
      renderBars($('#mBars', host), ['0', '1'], q.probabilities());
      $('#mOut', host).textContent = 'This qubit is a perfect 50/50 mix. Measure it!';
    }
    $('#mMeasure', host).addEventListener('click', () => {
      const r = q.measure();
      renderBars($('#mBars', host), ['0', '1'], q.probabilities());
      $('#mOut', host).textContent = `Collapsed to ${r}! Now it's stuck at ${r} — measure again and you'll keep getting ${r}. Press Reset to restore the mix.`;
    });
    $('#mReset', host).addEventListener('click', reset);
    reset();
  })();

  // ============================================================
  //  WIDGET 5 — single-qubit gate playground
  // ============================================================
  (function () {
    const host = $('#w-gates'); if (!host) return;
    host.innerHTML = `<h4>🎛️ Gate playground</h4>
      <div class="btnrow">
        <button class="btn gate" data-g="X">X</button>
        <button class="btn gate" data-g="H">H</button>
        <button class="btn gate" data-g="Z">Z</button>
        <button class="btn ghost small" id="gMeasure">👁️ Measure</button>
        <button class="btn ghost small" id="gReset">↺ Reset</button>
      </div>
      <div id="gBars"></div>
      <div class="readout" id="gOut"></div>`;
    let q, history = [];
    function show() {
      renderBars($('#gBars', host), ['0', '1'], q.probabilities());
      const a = q.amps;
      $('#gOut', host).textContent =
        `Gates applied: ${history.join(' → ') || '(none yet — start at |0⟩)'}\n` +
        `amplitudes:  0: ${fmt(a[0])}   1: ${fmt(a[1])}`;
    }
    function fmt(c) { const r = c.re.toFixed(2), i = c.im.toFixed(2); return Math.abs(c.im) < 1e-9 ? r : `${r}${c.im >= 0 ? '+' : ''}${i}i`; }
    function reset() { q = new Q.QState(1); history = []; show(); }
    $$('.gate', host).forEach(b => b.addEventListener('click', () => {
      const g = b.dataset.g; q.applySingle(Q.GATES[g], 0); history.push(g); show();
    }));
    $('#gMeasure', host).addEventListener('click', () => {
      const r = q.measure(); history.push('Measure=' + r); show();
    });
    $('#gReset', host).addEventListener('click', reset);
    reset();
  })();

  // ============================================================
  //  WIDGET 6 — Bloch sphere
  // ============================================================
  (function () {
    const host = $('#w-bloch'); if (!host) return;
    host.innerHTML = `<h4>🌐 The qubit's globe</h4>
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
      ctx.strokeStyle = '#2c3a72'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, 7); ctx.stroke();
      // equator (squished ellipse)
      ctx.beginPath(); ctx.ellipse(CX, CY, R, R * 0.35, 0, 0, 7); ctx.stroke();
      // vertical axis
      ctx.beginPath(); ctx.moveTo(CX, CY - R); ctx.lineTo(CX, CY + R); ctx.stroke();
      // labels
      ctx.fillStyle = '#9fb0e0'; ctx.font = '14px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.fillText('|0⟩ (North)', CX, CY - R - 8);
      ctx.fillText('|1⟩ (South)', CX, CY + R + 18);
      // arrow
      const v = Q.blochVector(q);            // x,y,z each -1..1
      const px = CX + v.x * R;               // project: x → screen x
      const py = CY - v.z * R + v.y * R * 0.35; // z → up, y → depth tilt
      ctx.strokeStyle = '#ff6ec7'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#5ce1e6'; ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#161f44'; ctx.beginPath(); ctx.arc(CX, CY, 4, 0, 7); ctx.fill();
    }
    function reset() { q = new Q.QState(1); draw(); }
    $$('.gate', host).forEach(b => b.addEventListener('click', () => { q.applySingle(Q.GATES[b.dataset.g], 0); draw(); }));
    $('#bReset', host).addEventListener('click', reset);
    reset();
  })();

  // ============================================================
  //  WIDGET 7 — entanglement (Bell pair)
  // ============================================================
  (function () {
    const host = $('#w-bell'); if (!host) return;
    host.innerHTML = `<h4>👻 Two entangled qubits</h4>
      <div class="btnrow">
        <button class="btn" id="bellMeasure">👁️ Measure both</button>
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
        `Qubit A = ${s[0]},  Qubit B = ${s[1]}  →  they MATCH! 🎉\n` +
        `Notice: you only ever see 00 or 11, never 01 or 10. The qubits are linked.`;
      refresh();
    });
    $('#bellReset', host).addEventListener('click', () => { counts = { '00': 0, '01': 0, '10': 0, '11': 0 }; $('#bellOut', host).textContent = ''; refresh(); });
    refresh();
  })();

  // ============================================================
  //  WIDGET 8 — circuit builder (2 qubits, 5 columns)
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

    host.innerHTML = '<h4>🧩 Build & run a circuit</h4>' +
      '<p style="color:#9fb0e0;margin:0 0 8px">Click cells to cycle: empty → H → X → Z → • (CNOT control). A • links to the other qubit in that column.</p>';
    host.appendChild(table);
    const controls = el('div', 'btnrow',
      '<button class="btn" id="runBtn">▶ Run (1000 shots)</button>' +
      '<button class="btn ghost small" id="clrBtn">🗑️ Clear</button>');
    host.appendChild(controls);
    const out = el('div', 'readout'); out.id = 'circOut'; out.textContent = 'Build something, then press Run!';
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
      out.textContent = 'Circuit: ' + (steps.join('  →  ') || '(empty)') + '\nResults of 1000 measurements below ⬇️';
    }
    $('#runBtn', host).addEventListener('click', run);
    $('#clrBtn', host).addEventListener('click', () => {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { grid[r][c] = ''; }
      $$('.cell', host).forEach(c => paint(c, ''));
      barsBox.innerHTML = ''; histBox.innerHTML = ''; out.textContent = 'Cleared. Build something new!';
    });
  })();

  // ============================================================
  //  WIDGET 9 — interference demo (H then H)
  // ============================================================
  (function () {
    const host = $('#w-interference'); if (!host) return;
    let counts = { 0: 0, 1: 0 };
    host.innerHTML = `<h4>✨ The "always 0" trick (H → H)</h4>
      <div class="btnrow">
        <button class="btn" id="intRun">▶ Run once</button>
        <button class="btn" id="intRun100">▶ Run 100 times</button>
        <button class="btn ghost small" id="intReset">↺ Reset</button>
      </div>
      <div class="readout" id="intOut">A normal coin flipped twice is still random. A quantum coin H-ed twice is ALWAYS 0. Try it!</div>
      <div id="intHist"></div>`;
    function once() { const q = new Q.QState(1); q.applySingle(Q.GATES.H, 0); q.applySingle(Q.GATES.H, 0); return q.measure(); }
    function refresh() { renderHist($('#intHist', host), ['0', '1'], counts); }
    $('#intRun', host).addEventListener('click', () => { counts[once()]++; refresh(); $('#intOut', host).textContent = `Result: 0 every time. The "1" waves cancelled out! (totals → 0:${counts[0]}, 1:${counts[1]})`; });
    $('#intRun100', host).addEventListener('click', () => { for (let i = 0; i < 100; i++) counts[once()]++; refresh(); $('#intOut', host).textContent = `Ran 100 times. Still 0 every single time → 0:${counts[0]}, 1:${counts[1]}. That's interference!`; });
    $('#intReset', host).addEventListener('click', () => { counts = { 0: 0, 1: 0 }; refresh(); });
    refresh();
  })();

  // ============================================================
  //  QUIZZES
  // ============================================================
  const QUIZZES = {
    1: [
      { q: 'A normal bit can be…', opts: ['Only 0 or only 1', 'Both 0 and 1 at once', 'Any colour'], a: 0, why: 'A classic bit is like a light switch — only off (0) or on (1).' },
      { q: 'A qubit BEFORE you measure it is like…', opts: ['A switch stuck on', 'A spinning coin (a mix of 0 and 1)', 'A broken bit'], a: 1, why: 'Before measuring, a qubit can be a mix — the spinning coin!' },
    ],
    2: [
      { q: 'Superposition means a qubit is…', opts: ['Definitely 0', 'A mix of 0 and 1 with certain probabilities', 'Faster than a bit'], a: 1, why: 'Superposition = a blend of 0 and 1, each with some chance.' },
      { q: 'If a qubit is 50/50 and you measure it once, you get…', opts: ['Always 0', 'Half a 0', 'Randomly 0 or 1'], a: 2, why: 'One measurement is random; only over many tries do you see ~50/50.' },
    ],
    3: [
      { q: 'What happens when you measure a qubit?', opts: ['Nothing changes', 'It collapses to one definite value', 'It speeds up'], a: 1, why: 'Measuring collapses the superposition to a single value.' },
      { q: 'After a qubit collapses to 1, measuring again gives…', opts: ['1 again', 'A random value', '0'], a: 0, why: 'Once collapsed, it stays put until you change it.' },
    ],
    4: [
      { q: 'Which gate makes a 50/50 superposition from |0⟩?', opts: ['X', 'H', 'Z'], a: 1, why: 'H (Hadamard) — the "Mixer" — turns 0 into a 50/50 mix.' },
      { q: 'The X gate…', opts: ['Flips 0↔1', 'Measures the qubit', 'Deletes it'], a: 0, why: 'X is the flip/NOT gate.' },
    ],
    5: [
      { q: 'On the Bloch sphere, the North Pole means…', opts: ['Definitely 1', 'Definitely 0', 'A 50/50 mix'], a: 1, why: 'North = |0⟩, South = |1⟩, equator = mix.' },
      { q: 'Gates basically…', opts: ['Rotate the arrow on the globe', 'Erase the qubit', 'Add more qubits'], a: 0, why: 'Every gate is just a rotation of the Bloch arrow.' },
    ],
    6: [
      { q: 'Entangled qubits…', opts: ['Never affect each other', 'Are linked — measuring one tells you about the other', 'Are just two normal bits'], a: 1, why: 'That\'s the "spooky" link Einstein worried about.' },
      { q: 'Can you send a message faster than light with entanglement?', opts: ['Yes, instantly', 'No — each result is random', 'Only on Tuesdays'], a: 1, why: 'No real signal travels; you only see the link when comparing results.' },
    ],
    7: [
      { q: 'A quantum circuit is read…', opts: ['Right to left', 'Left to right, like music', 'Top to bottom'], a: 1, why: 'Qubits flow along wires from left to right.' },
      { q: 'H on q0 then CNOT(q0→q1) creates…', opts: ['A random number', 'An entangled Bell pair', 'A dead qubit'], a: 1, why: 'That exact recipe makes the famous Bell pair.' },
    ],
    8: [
      { q: 'Interference lets a quantum computer…', opts: ['Make wrong answers cancel and right answers grow', 'Run hotter', 'Use more electricity'], a: 0, why: 'Cancel the wrong, amplify the right — the core trick.' },
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
    box.appendChild(el('h2', null, '🧩 Quick Quiz'));
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

  // ---------- go! ----------
  refreshProgress();
  goTo(0);
})();
