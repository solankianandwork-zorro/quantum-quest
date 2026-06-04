"""
03_interference.py  —  The quantum SECRET SAUCE ✨
==================================================
Goal: see interference with your own eyes.

- One H gate  → random 50/50  (a spinning coin)
- Two H gates → ALWAYS 0      (the coin's "1" waves cancel out!)

This "make wrong answers cancel, right answers grow" is the heart of
powerful algorithms like Grover's search and Shor's factoring.

Run it:   python 03_interference.py
"""

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")  # so emojis & circuit art print on Windows
except Exception:
    pass

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

sim = AerSimulator()
shots = 1000


def measure_counts(qc):
    qc.measure(0, 0)
    return sim.run(qc, shots=shots).result().get_counts()


def ascii_bars(counts):
    for outcome in sorted(counts):
        n = counts.get(outcome, 0)
        bar = "█" * int(40 * n / shots)
        print(f"  |{outcome}>  {bar}  {n}")


# ---- Experiment A: ONE H gate (random) ----
a = QuantumCircuit(1, 1)
a.h(0)
print("Experiment A — ONE H gate (a spinning coin):")
ascii_bars(measure_counts(a))
print()

# ---- Experiment B: TWO H gates (interference → always 0) ----
b = QuantumCircuit(1, 1)
b.h(0)
b.h(0)
print("Experiment B — TWO H gates (interference!):")
ascii_bars(measure_counts(b))
print()

print("👉 One H = random. Two H = ALWAYS 0.")
print("   The two 'waves' for the |1> path cancelled out. That's interference —")
print("   the trick that makes quantum computers powerful!")
