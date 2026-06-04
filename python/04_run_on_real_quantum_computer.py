"""
04_run_on_real_quantum_computer.py  —  Use a REAL quantum computer! 🤯
=====================================================================
This sends your circuit over the internet to one of IBM's actual
quantum chips (kept colder than outer space) and brings the answers back.

BEFORE YOU RUN THIS:
  1. Make a free account at  https://quantum.ibm.com
  2. Copy your API token from the dashboard.
  3. Paste it below where it says PASTE_YOUR_TOKEN_HERE.
  4. Run:  python 04_run_on_real_quantum_computer.py

Heads up: real machines are shared worldwide, so your job may wait in a
queue for a bit. That's totally normal — you're using real science hardware!
"""

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")  # so emojis & circuit art print on Windows
except Exception:
    pass

from qiskit import QuantumCircuit, transpile

# Paste your secret token between the quotes:
TOKEN = "PASTE_YOUR_TOKEN_HERE"


def build_bell():
    """The same entangled Bell pair from lesson 6/file 02."""
    qc = QuantumCircuit(2, 2)
    qc.h(0)
    qc.cx(0, 1)
    qc.measure([0, 1], [0, 1])
    return qc


def main():
    if TOKEN == "PASTE_YOUR_TOKEN_HERE":
        print("✋ First paste your IBM Quantum token into this file (the TOKEN variable).")
        print("   Get one free at https://quantum.ibm.com")
        return

    # These imports are only needed for real hardware, so we do them here.
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2

    # 1) Connect to IBM with your token.
    #    NOTE: IBM retired the old "ibm_quantum" channel in 2025. New free
    #    accounts use the "ibm_quantum_platform" channel below. If your account
    #    needs an instance, copy its CRN from quantum.ibm.com and pass it too:
    #        QiskitRuntimeService(channel="ibm_quantum_platform", token=TOKEN,
    #                             instance="YOUR_INSTANCE_CRN")
    print("Connecting to IBM Quantum...")
    service = QiskitRuntimeService(channel="ibm_quantum_platform", token=TOKEN)

    # 2) Pick the least-busy real quantum computer that can run our circuit.
    backend = service.least_busy(operational=True, simulator=False, min_num_qubits=2)
    print(f"Chosen real quantum computer: {backend.name}")

    # 3) Translate our circuit into the gates this specific chip understands.
    qc = build_bell()
    qc = transpile(qc, backend=backend)

    # 4) Send the job and wait for the answer.
    print("Sending your circuit to the real machine... (this may queue for a while)")
    sampler = SamplerV2(mode=backend)
    job = sampler.run([qc], shots=1000)
    print(f"Job id: {job.job_id()}  — you can also watch it on quantum.ibm.com")
    result = job.result()

    # 5) Read out the counts.
    counts = result[0].data.c.get_counts()
    print("\nResults from a REAL quantum computer:")
    for outcome in sorted(counts):
        print(f"  |{outcome}>  {counts[outcome]}")
    print("\n🎉 You just ran a program on real quantum hardware!")
    print("   (You'll mostly see 00 and 11 — plus a few 'mistakes' because real")
    print("    qubits are noisy. Cleaning up that noise is a huge field of research!)")


if __name__ == "__main__":
    main()
