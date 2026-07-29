---
layout: ../../layouts/ArticleLayout.astro
title: "Behavior Tree Blackboards: How Nodes Share Data"
description: "What a blackboard is, why every serious behavior tree framework has one, how key scoping works, and the patterns — and pitfalls — of using blackboards in Unreal, BehaviorTree.CPP, and behavior3."
pubDate: "2026-07-28"
order: 3
---

# Behavior Tree Blackboards

A behavior tree is very good at describing *control flow* — what to try first, what to fall
back to — and completely silent about *data flow*. The tree says "Chase the player," but
nothing in the structure says how `Is Player Visible?` tells `Move To Player` **which**
player, or where it was last seen. Every practical framework solves this the same way: a
**blackboard**.

A blackboard is a key/value store attached to the agent (or the tree instance) that acts as
the tree's working memory. Leaves read from it and write to it; the tree structure itself
never touches it.

```text
   Perception system ──writes──▶ ┌─────────────────────────┐
                                 │        Blackboard        │
                                 │  target:    Player #2    │
                                 │  lastSeen:  (14, 3, 20)  │
                                 │  health:    34           │
                                 └─────────────────────────┘
                                    ▲               ▲
                            reads───┘               └───reads
                     Is Player Visible?          Move To (target)
```

The name comes from classic AI: independent specialists cooperating by reading and writing
a shared blackboard, none of them talking to each other directly. That indirection is the
entire point — `Is Player Visible?` and `Move To Player` stay reusable, single-purpose
leaves precisely because neither knows the other exists.

## Why not just use member variables?

You can, for a one-off agent. But the blackboard buys three things member variables don't:

- **Leaves stay generic.** A `MoveTo(key)` task that reads its destination from a
  blackboard key works for chasing, fleeing, patrolling, and returning home — four
  behaviors, one action. This is the "small, parameterized leaves" advice from
  [the node reference](/learn/behavior-tree-nodes-explained/) made concrete.
- **Sensors decouple from decisions.** Expensive checks (visibility raycasts, pathfinding
  queries) run on their own schedule and cache results in the blackboard; conditions in the
  tree just read the cached value. This is the standard fix for the "BTs re-check
  everything every tick" cost discussed in
  [the FSM comparison](/learn/behavior-trees-vs-state-machines/).
- **Tools can see it.** Because state lives in one inspectable place, visual debuggers can
  show you exactly what the tree believes — which is most of debugging an AI.

## Scoping: not all keys are equal

Mature frameworks scope blackboard data, and the scopes matter:

| Scope | Lifetime | Typical contents |
|-------|----------|------------------|
| Agent / global | The whole agent | Target, health, home position |
| Per-tree | One tree instance | "Is this tree's open-door subtree mid-way through?" |
| Per-node | One node in one tree | A memory sequence's running-child index, a cooldown's timestamp |

That last row is worth pausing on: **the tree's own bookkeeping lives in the blackboard
too.** In behavior3-family runtimes (the format this site's
[editor](/) exports), `MemSequence` stores which child was running, and `Cooldown` stores
its last-fired time, in node-scoped blackboard memory — which is why one tree definition
can drive a hundred agents simultaneously. The tree is stateless and shared; each agent's
blackboard carries all the per-agent state.

## The same idea in each ecosystem

- **Unreal Engine** makes the blackboard a first-class asset with typed keys, and goes a
  step further: decorators *observe* keys and abort running branches when values change —
  the blackboard isn't just memory, it's the event system. See
  [Behavior Trees in Unreal](/learn/behavior-trees-in-unreal-engine/).
- **BehaviorTree.CPP** (robotics) gives every node input/output *ports* wired to blackboard
  entries, and lets subtrees **remap** names at the boundary — the subtree reads `target`,
  the parent maps it to `enemy_position`. That remapping is what makes subtree reuse safe
  at scale. See [Behavior Trees in Robotics](/learn/behavior-trees-in-robotics/).
- **behavior3** exposes `blackboard.get(key, treeScope, nodeScope)` — the three scopes from
  the table, directly.

## Patterns that keep it sane

A blackboard is, structurally, a bag of global variables — and it degrades exactly the way
globals do if you're careless. The patterns that prevent that:

1. **Write from few places, read from many.** Perception/sensor code writes; tree leaves
   mostly read. When any node can write any key, you've rebuilt spaghetti with extra steps.
2. **Treat keys as an API.** The set of keys is the contract between your tree design and
   your engine code. Name keys like you'd name public API, and document them next to the
   tree.
3. **Clear stale data deliberately.** "Target died but `target` still points at the
   corpse" is the classic blackboard bug. Decide who nulls keys and when.
4. **Prefer a key per fact, not per behavior.** `lastKnownPlayerPosition` serves chase,
   search, and aim; `chaseDestination` serves one branch and multiplies.

## Try it

The [survival-override example](/?example=survival-override) is a good specimen: health,
target, and waypoint state all flow through the tree invisibly. Open it, and as you read
each leaf, ask "what key would this read or write?" — `health` feeds `Is Health Low?`,
perception writes the target `Move To Player` consumes, `Next Waypoint` advances an index
`Move To Waypoint` reads. Sketching that column is most of the work of taking a design to
[Unity](/learn/behavior-trees-in-unity/), [Unreal](/learn/behavior-trees-in-unreal-engine/),
or a robot.

<a class="try-editor" href="/?example=survival-override">▶ Open the survival-override example in the editor</a>

## Related guides

- [Sequence, Selector, and Decorator Nodes Explained](/learn/behavior-tree-nodes-explained/)
- [Debugging Behavior Trees](/learn/debugging-behavior-trees/)
- [Structuring Large Behavior Trees](/learn/structuring-large-behavior-trees/)
