# 🐍 Real Quantum Code — the Python track

You've played with the toys in the browser course. Now you'll write **real quantum
programs** and run them on a pretend (and then a REAL!) quantum computer.

---

## 1. Install the tools (one time)

You need **Python** first. If you don't have it, download it from
<https://www.python.org/downloads/> (tick "Add Python to PATH" during install on Windows).

Then open a terminal and install Qiskit:

```bash
pip install qiskit qiskit-aer qiskit-ibm-runtime
```

> 🙋 Stuck? Just ask Claude: **"install Python and Qiskit for me"** and it will do it for you.

---

## 2. Run the programs (in order)

Open a terminal in this `python/` folder and run them one by one:

```bash
python 01_hello_qubit.py      # one qubit in superposition
python 02_bell_state.py       # two entangled qubits (Bell pair)
python 03_interference.py     # the "always 0" magic trick
python 04_run_on_real_quantum_computer.py   # needs a free IBM account (see below)
```

Each file is FULL of friendly comments explaining every single line. Read them!

---

## 3. Run on a REAL quantum computer (free!) 🤯

1. Make a free account at **<https://quantum.ibm.com>**.
2. On your dashboard, copy your **API token** (a long secret code).
3. Open `04_run_on_real_quantum_computer.py` and paste your token where it says
   `PASTE_YOUR_TOKEN_HERE`.
4. Run it. Your program gets sent over the internet to a real, super-cold quantum
   chip, and the answers come back to your screen. You just used a real quantum
   computer! 🎉

> Real machines are shared by people all over the world, so your job might wait in a
> line for a little while. That's normal.

---

## What each file teaches

| File | Big idea |
|------|----------|
| `01_hello_qubit.py` | Superposition + measurement (Lessons 2 & 3) |
| `02_bell_state.py` | Entanglement (Lesson 6) |
| `03_interference.py` | Interference — the quantum secret sauce (Lesson 8) |
| `04_run_on_real_quantum_computer.py` | Using real cloud hardware (Lesson 9) |

When you're ready, tell Claude which **project** you want to build next!
