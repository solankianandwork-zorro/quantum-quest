"""
01_hello_qubit.py  —  Your very first REAL quantum program! 🪙
==============================================================
Goal: put one qubit into a 50/50 superposition (the spinning coin),
measure it 1000 times, and see roughly half 0s and half 1s.

Run it:   python 01_hello_qubit.py
"""

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")  # so emojis & circuit art print on Windows
except Exception:
    pass

from qiskit import QuantumCircuit            # lets us build quantum circuits
from qiskit_aer import AerSimulator          # a pretend quantum computer on your laptop


def ascii_bars(counts, shots):
    """Draw a little bar chart in the terminal so we can SEE the results."""
    for outcome in sorted(counts):
        n = counts[outcome]
        bar = "█" * int(40 * n / shots)
        print(f"  |{outcome}>  {bar}  {n}")


# ------------------------------------------------------------------
# Step 1: build the circuit
# A circuit with 1 qubit and 1 classical bit (a slot to store the result).
qc = QuantumCircuit(1, 1)

# Step 2: add gates
qc.h(0)              # H gate = the "Mixer" → turns |0> into a 50/50 spinning coin
qc.measure(0, 0)     # measure qubit 0, store the answer in classical bit 0

# Step 3: look at our circuit (a tiny ASCII drawing!)
print("Here is your quantum circuit:")
print(qc.draw())
print()

# Step 4: run it 1000 times on the simulator
shots = 1000
result = AerSimulator().run(qc, shots=shots).result()
counts = result.get_counts()

# Step 5: show the results
print(f"Measured {shots} times:")
ascii_bars(counts, shots)
print()
print("👉 Notice it's about 50/50 — that's superposition + randomness in action!")
