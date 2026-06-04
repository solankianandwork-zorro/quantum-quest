"""
02_bell_state.py  —  Make two qubits ENTANGLED 👻
==================================================
Goal: build the famous "Bell pair" — two qubits that are magically linked.
When we measure them we ONLY ever see 00 or 11 (never 01 or 10).
They always match!

Run it:   python 02_bell_state.py
"""

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")  # so emojis & circuit art print on Windows
except Exception:
    pass

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


def ascii_bars(counts, shots):
    for outcome in sorted(counts):
        n = counts[outcome]
        bar = "█" * int(40 * n / shots)
        print(f"  |{outcome}>  {bar}  {n}")


# ------------------------------------------------------------------
# A circuit with 2 qubits and 2 classical bits.
qc = QuantumCircuit(2, 2)

# The Bell-pair recipe (you built this in Lesson 7!):
qc.h(0)            # 1) put qubit 0 into superposition (the Mixer)
qc.cx(0, 1)        # 2) CNOT: if qubit 0 is 1, flip qubit 1  → this LINKS them
qc.measure([0, 1], [0, 1])   # measure both qubits

print("Your entanglement circuit:")
print(qc.draw())
print()

shots = 1000
counts = AerSimulator().run(qc, shots=shots).result().get_counts()

print(f"Measured {shots} times:")
ascii_bars(counts, shots)
print()
print("👉 See? Only 00 and 11 show up. The two qubits ALWAYS match — that's entanglement!")
print("   (01 and 10 never appear, even though each qubit alone looks random.)")
