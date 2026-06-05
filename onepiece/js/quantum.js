/* ============================================================
   quantum.js — a tiny but REAL quantum computer simulator
   ------------------------------------------------------------
   This is the engine behind every interactive widget in the
   course. It stores the "state" of qubits as a list of complex
   numbers (called amplitudes) and applies gates with real math.
   You don't need to read this to do the course — but it's here
   if you ever get curious about how the magic actually works!
   ============================================================ */

// ---- Complex numbers: a number with a "real" and "imaginary" part ----
// (Don't worry about imaginary numbers — the simulator handles them.)
function C(re, im = 0) { return { re, im }; }
function cadd(a, b) { return C(a.re + b.re, a.im + b.im); }
function cmul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
function cabs2(a) { return a.re * a.re + a.im * a.im; }      // probability weight = |amplitude|^2
function carg(a) { return Math.atan2(a.im, a.re); }          // the "phase" angle

// ---- The quantum state of n qubits ----
// With n qubits there are 2^n possible answers (00, 01, 10, 11 ...),
// and each one has an amplitude. We start in the "all zeros" state.
class QState {
  constructor(n) {
    this.n = n;
    this.size = 1 << n;                 // 2^n
    this.amps = new Array(this.size).fill(0).map(() => C(0, 0));
    this.amps[0] = C(1, 0);             // start at |00...0> with 100% certainty
  }

  // Make an independent copy of the amplitude list (so gates don't clobber
  // the values they're still reading from).
  copyAmps() { return this.amps.map(a => C(a.re, a.im)); }

  clone() {
    const q = new QState(this.n);
    q.amps = this.copyAmps();
    return q;
  }

  // Prepare a SINGLE qubit so it has probability `p1` (0..1) of measuring 1.
  // Lets the widgets set a "lean" without poking at amplitudes directly.
  prepare1(p1) {
    this.amps[0] = C(Math.sqrt(1 - p1));
    this.amps[1] = C(Math.sqrt(p1));
    return this;
  }

  // Apply a single-qubit gate (a 2x2 grid of complex numbers) to one qubit.
  applySingle(gate, target) {
    const bit = 1 << target;
    const next = this.copyAmps();
    for (let i = 0; i < this.size; i++) {
      if ((i & bit) === 0) {            // i has a 0 in the target spot
        const j = i | bit;             // j is the matching index with a 1
        const a0 = this.amps[i];
        const a1 = this.amps[j];
        next[i] = cadd(cmul(gate[0][0], a0), cmul(gate[0][1], a1));
        next[j] = cadd(cmul(gate[1][0], a0), cmul(gate[1][1], a1));
      }
    }
    this.amps = next;
  }

  // CNOT: if the "control" qubit is 1, flip the "target" qubit.
  // This is the gate that creates entanglement (spooky linked qubits!).
  applyCNOT(control, target) {
    const cb = 1 << control;
    const tb = 1 << target;
    const next = this.copyAmps();
    for (let i = 0; i < this.size; i++) {
      if ((i & cb) !== 0 && (i & tb) === 0) {
        const j = i | tb;
        const tmp = next[i];
        next[i] = next[j];
        next[j] = tmp;
      }
    }
    this.amps = next;
  }

  // The chance (0 to 1) of seeing each possible answer.
  probabilities() { return this.amps.map(cabs2); }

  // "Look" at the qubits once. Picks one answer using the probabilities.
  // (We pass in a random number so results are repeatable if needed.)
  sampleOnce(rnd = Math.random()) {
    const p = this.probabilities();
    let acc = 0;
    for (let i = 0; i < p.length; i++) {
      acc += p[i];
      if (rnd <= acc) return i;
    }
    return p.length - 1;
  }

  // Measure for real: look once, then "collapse" so the qubits now
  // agree with what we saw (just like a real quantum computer).
  measure() {
    const outcome = this.sampleOnce();
    this.amps = this.amps.map((a, i) => (i === outcome ? C(1, 0) : C(0, 0)));
    return outcome;
  }

  // Turn an index like 3 into a qubit string like "11".
  bitstring(index) { return index.toString(2).padStart(this.n, '0'); }

  // Run many measurements WITHOUT collapsing (each shot samples the same
  // state independently — exactly what a "run 1000 shots" button wants).
  // Returns a tally keyed by bitstring, e.g. { '00': 512, '11': 488 }.
  sample(shots) {
    const counts = {};
    for (let s = 0; s < shots; s++) {
      const key = this.bitstring(this.sampleOnce());
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }
}

// ---- The famous gates, as 2x2 grids of complex numbers ----
const SQRT1_2 = Math.SQRT1_2; // = 1/sqrt(2) ≈ 0.707
const GATES = {
  // X = the "flip" gate (NOT): turns 0 into 1 and 1 into 0
  X: [[C(0), C(1)], [C(1), C(0)]],
  // H = Hadamard: the "make a superposition" gate (the spinning coin!)
  H: [[C(SQRT1_2), C(SQRT1_2)], [C(SQRT1_2), C(-SQRT1_2)]],
  // Z = adds a "phase flip" to the 1 part
  Z: [[C(1), C(0)], [C(0), C(-1)]],
  // Y = a flip plus a phase twist
  Y: [[C(0), C(0, -1)], [C(0, 1), C(0)]],
  // S and T = smaller phase twists used in fancier circuits
  S: [[C(1), C(0)], [C(0), C(0, 1)]],
  T: [[C(1), C(0)], [C(0), C(SQRT1_2, SQRT1_2)]],
  // I = do nothing (identity)
  I: [[C(1), C(0)], [C(0), C(1)]],
};

// ---- Turn a single qubit's state into an arrow on the Bloch sphere ----
// Returns x, y, z coordinates (each from -1 to 1) for the arrow tip.
function blochVector(q) {
  // remove the global phase using qubit 0's amplitude as reference
  const a = q.amps[0];
  const b = q.amps[1];
  const theta = 2 * Math.acos(Math.min(1, Math.sqrt(cabs2(a))));
  const phi = carg(b) - carg(a);
  return {
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.sin(theta) * Math.sin(phi),
    z: Math.cos(theta),
  };
}

// Make everything available to the rest of the course
window.Q = { C, cadd, cmul, cabs2, carg, QState, GATES, blochVector };
