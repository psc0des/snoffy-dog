# IBM Bob Sessions

This project was developed using a single IBM Bob task/session.

All prompts (~17 prompts including iterative debugging rounds) were issued within the same Bob task, leveraging Bob's persistent context. The task accumulated 130.9k of context across the session and consumed approximately 40 Bobcoins total.

## Contents

- **`single_task_summary.png`** — screenshot of the Task Session Consumption Summary panel from IBM Bob. Shows context length, token counts, cache usage, API cost, and the original task prompt.
- **`single_task_history.md`** — exported markdown task history for the same session. Contains every prompt sent to Bob, every Bob response, and every tool call / code change Bob made during the build.

## Session Statistics

- **Task ID:** `0472f178-95c2-4143-8b1f-fb8e499974f5`
- **Context Length:** 130.9k / 200.0k tokens
- **Total Tokens:** ↑ 15.6m / ↓ 120.7k
- **Cache:** ↑ 1.6m / ↓ 14.0m
- **API Cost:** ~40 Bobcoins
- **Transcript Size:** 2.67 MB
- **Internal Tasks Completed:** 36 / 36

## Why a single task

Keeping the entire build in one Bob task allowed Bob to maintain repository-wide context across all iterations — scanner rule pack, Granite integration, animation work, and debugging rounds all built on each other without re-explaining the codebase. The transcript shows Bob's reasoning carrying forward across every prompt.
