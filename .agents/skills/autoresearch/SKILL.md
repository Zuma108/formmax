---
name: autoresearch
description: "Autonomous AI research agent that iteratively modifies an LLM training setup (train.py), runs 5-minute experiments, and tracks results. Use when asked to run autonomous ML experiments, optimize a training loop, or iterate on model architecture/hyperparameters overnight. Adapted from karpathy/autoresearch."
---

# autoresearch

Autonomous LLM research loop. An AI agent that modifies `train.py`, trains for a fixed 5-minute budget, checks if `val_bpb` (validation bits per byte) improved, and repeats — indefinitely until manually stopped.

## Repo location

The full repo is cloned at:
```
.agents/skills/autoresearch/repo/
```

Key files:
- `repo/program.md` — the agent's operating instructions (the "skill" for the agent)
- `repo/train.py` — the file the agent edits (model, optimizer, training loop)
- `repo/prepare.py` — fixed data prep + evaluation harness (do NOT modify)
- `repo/README.md` — full context and setup guide

---

## Requirements

- Single NVIDIA GPU (tested on H100; see README for smaller-GPU forks)
- Python 3.10+
- [uv](https://docs.astral.sh/uv/) package manager

## Quick setup

```bash
# 1. Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Install dependencies
cd .agents/skills/autoresearch/repo
uv sync

# 3. One-time data prep (~2 min)
uv run prepare.py

# 4. Test a single run manually (~5 min)
uv run train.py
```

## Running the agent

Navigate to the repo folder and prompt the agent:

> "Have a look at program.md and let's kick off a new experiment! Let's do the setup first."

The agent will:
1. Create an `autoresearch/<tag>` git branch
2. Read `prepare.py` and `train.py` for context
3. Run experiments in a loop: modify → train → check `val_bpb` → keep/discard
4. Log all results to `results.tsv`
5. Never stop until manually interrupted

## Metric

`val_bpb` (validation bits per byte) — **lower is better**. Vocab-size-independent so all architectural changes are fairly compared.

## What the agent CAN change (in `train.py`)

- Model architecture (depth, width, attention type, etc.)
- Optimizer and hyperparameters
- Batch size, learning rate schedule
- Training loop logic

## What it CANNOT change

- `prepare.py` (fixed evaluation harness)
- Add new package dependencies
- Modify the `evaluate_bpb` function

## Results log format (`results.tsv`)

Tab-separated, columns: `commit`, `val_bpb`, `memory_gb`, `status`, `description`

Status values: `keep`, `discard`, `crash`

---

## Notable forks for smaller hardware

- macOS: https://github.com/miolini/autoresearch-macos
- macOS MLX: https://github.com/trevin-creator/autoresearch-mlx
- Windows RTX: https://github.com/jsegov/autoresearch-win-rtx
- AMD: https://github.com/andyluo7/autoresearch

## Source

https://github.com/karpathy/autoresearch (MIT License)
