---
layout: ../../layouts/ArticleLayout.astro
title: "Debugging Behavior Trees: The 6 Classic Mistakes"
description: "Why your sequence restarts every tick, why the tree won't switch branches, why the agent flip-flops between two behaviors — the recurring behavior tree bugs, their causes, and how to fix each one."
pubDate: "2026-07-28"
order: 12
---

# Debugging Behavior Trees

Behavior tree bugs are rarely in the leaves. `MoveTo` works, `Attack` works — and the agent
still stands there vibrating, or walks through combat like it's blind. That's because most
BT bugs are *structural*: the tick semantics doing exactly what you told them to, which
isn't what you meant. The good news is that the same six mistakes account for nearly all of
it. (Tick semantics fuzzy? Keep [the node reference](/learn/behavior-tree-nodes-explained/)
open beside this.)

## 1. "My sequence restarts from the beginning every tick"

The agent walks to a waypoint, waits… and instead of advancing, walks to the same waypoint
forever.

A plain **Sequence re-ticks from its first child every tick**. If that first child is an
action that succeeds again ("move to waypoint" — already there, Success), the sequence
grinds through the same prefix each tick and never *progresses*. That reactive restart is
what you want for guarded branches (`In Range? → Attack` should re-check range!) and wrong
for step-by-step procedures.

**Fix:** procedural checklists get a **memory** composite (`MemSequence` / "with memory");
reactive guards keep the plain one. The rule of thumb: *guard → plain, checklist → memory.*

## 2. "The tree never switches to the higher-priority branch"

The player walks right up to a patrolling enemy and… it finishes its patrol route.

Three common causes, in order of likelihood:

- **A memory composite at the wrong level.** A `MemSelector` at the root remembers it
  chose Patrol and skips re-evaluating Combat until patrol finishes. Roots that must stay
  reactive should be plain selectors.
- **In Unreal: no observer aborts.** UE trees don't re-evaluate from the root; decorators
  must have Observer Aborts set (typically *Lower Priority*) to yank execution out of a
  running branch. This is the #1 UE-specific confusion — see
  [Behavior Trees in Unreal](/learn/behavior-trees-in-unreal-engine/).
- **A Running child pinning the tree** in frameworks/configurations that resume the
  running node directly instead of re-descending from the root.

## 3. "A condition is secretly an action"

`Is Door Locked?` that *tries the handle* — mutating the world, taking time, playing a
sound. Conditions get re-evaluated constantly by reactive composites; any side effect in
one fires on every tick from every branch that checks it.

**Fix:** conditions read state and return instantly, Success or Failure, never Running —
nothing else. If a check is expensive (raycasts, pathfinding), run it in a sensor on its
own schedule and cache the result in the
[blackboard](/learn/behavior-tree-blackboard/); the condition just reads the cache.

## 4. "The decorator is attached to the wrong node"

A cooldown on the *range check* starts its clock every time the check fails; a cooldown on
the *attack sequence* does what you meant. An inverter around a *sequence* inverts the
whole branch's result, not the one condition you were thinking of. Decorator misplacement
compiles fine, looks fine at a glance, and quietly shifts semantics —
[the examples page](/learn/behavior-tree-examples/) calls this out for cooldown-gated
specials specifically.

**Fix:** for each decorator, say out loud *exactly* which result it transforms. If the
sentence surprises you, move it. The
[cooldown-specials example](/?example=cooldown-specials) shows the correct placement —
cooldown around the whole attack sequence.

## 5. "Everything returns Success instantly"

The agent "patrols" by teleport: every action completes in one tick because nothing
returns **Running**. New implementers write actions like functions — do the thing, return.
But `MoveTo` is dozens of ticks of work; returning Success on tick one means the tree
races to the end every frame.

**Fix:** long actions return Running until genuinely done. If you're
[writing your own runtime](/learn/how-to-implement-a-behavior-tree/), this is the first
thing to get right — and the first thing to test.

## 6. "The agent flip-flops between two branches"

Health 30 → flee; fleeing breaks contact, health regen ticks to 31 → fight; take a hit →
flee… The tree is *correctly* re-evaluating a boundary condition that keeps crossing its
threshold.

**Fix:** hysteresis. Enter the flee state below 30 but only leave it above 60 — easiest as
a blackboard flag a sensor sets and clears at different thresholds, with the tree checking
the flag. Oscillation is a *design* smell, not a tick bug; hard cutoffs on continuously
varying values always thrash. (The
[survival-override example](/?example=survival-override) is this exact flee/fight shape —
open it and consider where the hysteresis would go.)

## The meta-fix: watch the tree run

All six bugs become obvious the moment you can *see* per-node status live — which is why
every serious ecosystem grew a viewer (UE's in-editor debugger, Groot2 for
[BehaviorTree.CPP](/learn/behavior-trees-in-robotics/), ascii trees in
[py_trees](/learn/behavior-trees-in-python/)). Log status *changes* rather than statuses
(the tick spam drowns you otherwise), and test subtrees in isolation before grafting them
into the full brain.

And before any of that: check the structure itself. Rebuild the suspect branch in the
[free online editor](/) where you can see the whole shape at once — misplaced decorators
and missing guards usually jump out visually.

<a class="try-editor" href="/?example=enemy-patrol">▶ Open a known-good tree to compare against</a>

## Related guides

- [Sequence, Selector, and Decorator Nodes Explained](/learn/behavior-tree-nodes-explained/)
- [Behavior Tree Blackboards](/learn/behavior-tree-blackboard/)
- [Behavior Tree Examples: Common Game AI Patterns](/learn/behavior-tree-examples/)
