---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "Sequence、Selector 與 Decorator 節點詳解"
description: "行為樹節點類型的完整參考 — sequence、selector、parallel、memory 變體、decorator、condition 與 action — 附有可在免費線上編輯器開啟的實際範例。"
pubDate: "2026-07-20"
order: 2
---
lang: zh_TW

# Sequence、Selector 與 Decorator 節點詳解

每一棵行為樹，從手機遊戲裡的雞到倉庫機器人，都是由少數幾種節點類型組成的。掌握這些節點類型，你就能讀懂任何人的行為樹。本指南涵蓋每一種節點類型、其精確的 tick 語義，以及適用情境。

首先定義狀態，因為以下所有內容都以它們為基礎：被 tick 的節點會回傳 **Success**、**Failure** 或 **Running**（需要更多 tick 才能完成）。

## Sequence — AND 節點

**Sequence** 從左到右 tick 其子節點：

- 若某子節點回傳 **Failure** → sequence 立即回傳 **Failure**。
- 若某子節點回傳 **Running** → sequence 回傳 **Running**。
- 若某子節點回傳 **Success** → 繼續下一個子節點。
- 所有子節點皆成功 → **Success**。

適用於每一步都不可或缺的多步驟程序：

```text
Sequence "Use the key"
├── Has Key?          (condition)
├── Unlock Door       (action)
├── Open Door         (action)
└── Walk Through      (action)
```

如果 `Has Key?` 失敗，其餘步驟就不會執行。這也是標準的 *guarded action* 模式：將 condition 放在前面，後面的 action 只在條件成立時才會執行。

## Selector — OR 節點（也稱為 Priority、Fallback）

**Selector** 也從左到右 tick 其子節點，但規則相反：

- 若某子節點回傳 **Success** → selector 立即回傳 **Success**。
- 若某子節點回傳 **Running** → selector 回傳 **Running**。
- 若某子節點回傳 **Failure** → 嘗試下一個子節點。
- 所有子節點皆失敗 → **Failure**。

可用來表達優先順序的策略 — 第一個子節點是最高優先選項：

```text
Selector "Enter the room"
├── Sequence: door already open → walk in
├── Sequence: has key → unlock → open → walk in
└── Sequence: smash the door → walk in
```

<a class="try-editor" href="/?example=open-the-door">▶ 在編輯器中開啟此樹</a>

名稱因生態系統而異：Unreal Engine 與多數遊戲文獻稱為 *Selector*，behavior3 系列編輯器稱為 *Priority*，機器人文獻（BehaviorTree.CPP）則稱為 *Fallback*。語義完全相同。

## Memory 變體 — MemSequence 與 MemSelector

一般的 sequence 每次 tick 都會從**第一個**子節點重新開始 tick。這在反應性檢查（「玩家是否還在範圍內？」）時是必要的，但對不應重啟的逐步程序來說，這會浪費運算——甚至破壞邏輯。

**Memory** 複合節點（behavior3 中的 `MemSequence`/`MemPriority`，其他框架中稱為 "with memory"）會記住哪個子節點正在 Running，並在下一次 tick 從該節點繼續執行，跳過前面的子節點，直到整個複合節點完成並重設。

經驗法則：**反應性守衛 → 用一般複合節點；程序性檢查清單 → 用 memory 複合節點。**

## Parallel — 同時執行子節點

**Parallel** 每次 tick 會**同時** tick *所有*子節點，並根據策略合併它們的狀態，例如「全部成功才算成功，一個失敗就失敗」。常見用途：在移動時同時播放動畫，或在執行子樹時監控條件。並非所有框架都提供此節點（經典 behavior3 就沒有）；在機器人領域中，常用於「執行中同時監控」的模式。

## Decorator — 單一子節點，修改結果

**decorator** 包裝一個子節點，並轉換其結果或控制其執行：

| Decorator | 功能 | 常見用途 |
|-----------|------|----------|
| Inverter | Success ↔ Failure | 「是否**沒有**看到敵人？」 |
| Succeeder / Failer | 總是回傳 Success / Failure | 讓選擇性步驟不阻塞流程 |
| Repeater | 重複執行子節點 N 次（或無限次） | 閒置循環、動畫 |
| Repeat Until Success | 重複直到子節點成功 | 重試不穩定的抓取動作 |
| Repeat Until Failure | 重複直到子節點失敗 | 「收集金幣，直到沒有剩餘」 |
| Limiter | 限制子節點可執行的次數 | 一次性事件 |
| Max Time | 若子節點超過時間預算則使其失敗 | 路徑追蹤超時 |
| Cooldown | 在一段時間內禁止重新執行 | 特殊攻擊 |

Decorator 的名稱在不同引擎之間差異最大，但幾乎都是上述這些模式之一。

## Conditions 與 Actions — 葉節點

**Conditions** 讀取狀態並即時回答：Success（「是」）或 Failure（「否」）。它們不應改變世界狀態，也不應回傳 Running——這樣才能安全地在每次 tick 時重新評估。

**Actions** 執行實際工作，也是 `Running` 發揮價值的地方：`MoveTo` 會在移動所需的數十個 tick 中回傳 Running，到達後回傳 Success，若無可行路徑則回傳 Failure。

設計提示：讓葉節點**既小又參數化**。一個通用的 `MoveTo(target, speed)` action 在十二個地方重複使用，勝過十二個特製的移動 action。condition 與 action 葉節點是行為樹（設計）與引擎程式碼（實作）之間的 API——只要 API 保持乾淨，行為樹就能保持可讀性。（葉節點透過 [blackboard](/learn/behavior-tree-blackboard/) 共享資料——這就是 `MoveTo` 知道「去哪裡」的方式。）

## 整合應用

一個使用了上述幾乎所有節點類型的實際敵人 AI：

```text
Selector "Enemy brain"
├── Sequence "Combat"
│   ├── Is Player In Range?
│   └── Attack Player
├── Sequence "Chase"
│   ├── Is Player Visible?
│   └── Move To Player
└── Sequence "Patrol"          ← lowest priority, always succeeds eventually
    ├── Move To Waypoint
    ├── Wait (2000 ms)
    └── Next Waypoint
```

<a class="try-editor" href="/?example=enemy-patrol">▶ 互動式探索此行為樹</a>

每次 tick，selector 都會從最上方重新評估——這正是為什麼當你走進範圍時，敵人會**立即**從巡邏切換到攻擊模式，完全不需要撰寫任何轉換邏輯。

## 進一步閱讀

- 對概念還不熟悉？先從 [什麼是行為樹？](/learn/what-is-a-behavior-tree/) 開始
- 在[常見遊戲 AI 模式](/learn/behavior-tree-examples/)中觀看這些節點的實際應用
- 行為樹行為異常？[六個經典錯誤](/learn/debugging-behavior-trees/)全都是 tick 語義的 bug
- 想自己實作？[從零開始約 100 行程式碼](/learn/how-to-implement-a-behavior-tree/)
- 引擎特定指南：[Unity](/learn/behavior-trees-in-unity/) ·
  [Unreal](/learn/behavior-trees-in-unreal-engine/) ·
  [機器人學](/learn/behavior-trees-in-robotics/)