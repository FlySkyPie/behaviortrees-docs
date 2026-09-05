---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "什麼是行為樹？遊戲 AI 的實用入門指南"
description: "從頭解釋行為樹：什麼是行為樹、tick、序列、選擇器和裝飾器如何運作、為什麼遊戲和機器人使用它們，以及一個可以親自試用的互動式編輯器。"
pubDate: "2026-07-20"
order: 1
---
lang: zh_TW

# 什麼是行為樹？

**行為樹**是一種組織 AI 代理（遊戲敵人、NPC、機器人）決策邏輯的方式——它將邏輯表示為一棵由小型可重複使用任務組成的樹。與其撰寫一大團 `if/else` 陳述式或一個難以管理的狀態機，不如組合簡單的積木：*「先試這個，不行就換那個，重複直到成功。」*

行為樹在 **Halo 2** 於 2000 年代中期推廣後，成為遊戲中主流的 AI 架構，而《Bioshock》和《Spore》等作品更確立了它的地位。如今行為樹已內建於 Unreal Engine，可透過熱門資產在 Unity 中使用，並透過 BehaviorTree.CPP 和 ROS 2 等函式庫廣泛應用於機器人領域。

最快建立直覺的方式就是直接看一個例子。這是一套完整的敵人 AI：

```text
                    ┌─────────────┐
                    │  Selector    │  "依序嘗試每個子節點，直到其中一個成功"
                    └──────┬──────┘
        ┌──────────────────┼───────────────────┐
   ┌────┴─────┐      ┌─────┴─────┐       ┌─────┴─────┐
   │ Sequence │      │ Sequence  │       │ Sequence  │
   │ (Attack) │      │  (Chase)  │       │ (Patrol)  │
   └────┬─────┘      └─────┬─────┘       └─────┬─────┘
     ┌──┴───┐           ┌──┴────┐        ┌─────┼─────────┐
  In range? Attack   Visible? Chase   Waypoint  Wait  Next point
```

<a class="try-editor" href="/?example=enemy-patrol">▶ 在免費編輯器中開啟這棵完整的樹</a>

從上到下、從左到右閱讀：*如果玩家在範圍內，就攻擊；否則如果玩家可見，就追趕；否則巡邏。* 這種優先順序自然來自結構本身——不需要旗標，也不需要手動連接狀態轉換。

## Tick：行為樹如何「運作」

行為樹不會持續執行。AI 系統會以某個間隔對樹進行 **tick**——每幀、每隔幾幀，或每當相關狀態發生變化時。每次 tick 時，執行從根節點開始，向下流經整棵樹。

每個被 tick 的節點會回傳三種狀態之一：

| 狀態 | 意義 |
|--------|---------|
| **Success** | 任務完成並達成目標（「已到達目標」）。 |
| **Failure** | 任務無法成功（「沒有到達目標的路徑」）。 |
| **Running** | 任務需要更多時間（「仍在移動中」）。 |

第三種狀態 `Running` 正是行為樹與簡單決策樹的區別所在：任務可能需要多個影格才能完成，而樹會記住哪些任務正在進行中。

## 四種節點類型

行為樹中的幾乎所有內容都屬於以下四種節點類別之一。

### 1. 複合節點控制流程

複合節點含有多個子節點，並決定哪些子節點執行以及以什麼順序執行：

- **Sequence（序列）** — 從左到右執行子節點，當其中一個子節點失敗時立即失敗。它相當於 AND：*所有*步驟都必須成功。「有鑰匙 → 開鎖 → 開門。」
- **Selector（選擇器）**（也稱為 *Priority* 或 *Fallback*）— 從左到右執行子節點，當其中一個子節點成功時立即成功。它是有優先順序的 OR：「攻擊，否則追趕，否則巡邏。」

這兩個節點就涵蓋了絕大多數真實的行為樹。許多實作會加入 **Parallel（並行）** 複合節點（同時執行子節點）以及記憶體變體（`MemSequence` / `MemPriority`），後者會從正在執行的子節點繼續執行，而不是每次都從頭開始重新評估。

### 2. 裝飾器修改單一子節點

裝飾器包裝恰好一個子節點，並改變其行為或結果：

- **Inverter（反向器）** — 翻轉 Success 和 Failure（將「敵人是可見的？」變成「敵人*不可見*？」）
- **Repeater（重複器） / Repeat Until Success（重複直到成功）** — 循環執行其子節點
- **Limiter（限制器） / cooldown（冷卻）** — 限制子節點可以執行的頻率

### 3. 條件節點檢查世界狀態

讀取遊戲或感測器狀態並立即回傳 Success 或 Failure 的葉子節點：`IsPlayerVisible?`（玩家是否可見？）、`HasAmmo?`（是否有彈藥？）、`IsBatteryLow?`（電量是否過低？）。它們永遠不回傳 Running。

### 4. 動作節點改變世界狀態

實際執行操作的葉子節點：`MoveToTarget`（移動到目標）、`PlayAnimation`（播放動畫）、`FireWeapon`（開火）、`GraspObject`（抓取物體）。動作節點在執行過程中通常會跨多個 tick 回傳 Running。

## 為什麼不直接用 if/else 或狀態機？

你*可以*用巢狀條件判斷或有限狀態機來建構巡邏/追趕/攻擊的敵人。但隨著 AI 成長，問題就會浮現：

- **模組化。** 行為樹的子樹是自包含的。你可以把整個「巡邏」分支抽出來，在另一個代理中重複使用，或直接替換掉，都不影響其他部分。在 FSM 中，轉換會把每個狀態與周圍的狀態耦合在一起。
- **優先順序與中斷無須額外實作。** 由於每次 tick 都會從根節點重新評估，優先順序較高的分支（如「生命值過低時逃跑」）會自然地搶先於較低的分支。在 FSM 中，你必須從*每個*狀態都加上一條轉換到逃跑狀態的連線。
- **大規模時仍可閱讀。** 設計師可以讀懂一棵樹。一個 40 個狀態的 FSM 轉換圖是一團義大利麵；一棵 40 個節點的樹仍然只是巢狀的優先順序。

當然也有實際的取捨——我們在[行為樹 vs 有限狀態機](/learn/behavior-trees-vs-state-machines/)中誠實地比較了這兩種架構。

## 親自試試看

理解行為樹最好的方式就是自己建一棵。本網站免費、無需註冊的[行為樹編輯器](/)可在瀏覽器中運行，讓你可以使用序列、選擇器、裝飾器以及自訂的動作/條件節點來建立樹，然後匯出乾淨的 JSON，直接載入到你的引擎或框架中。

<a class="try-editor" href="/?example=open-the-door">▶ 從經典的「開門」範例開始</a>

## 下一步

- [Sequence、Selector 和 Decorator 節點詳解](/learn/behavior-tree-nodes-explained/) — 深入探討每種節點類型，附有實際範例
- [行為樹 vs 有限狀態機](/learn/behavior-trees-vs-state-machines/)
- [Unity 中的行為樹](/learn/behavior-trees-in-unity/) ·
  [Unreal Engine](/learn/behavior-trees-in-unreal-engine/) ·
  [Godot](/learn/behavior-trees-in-godot/) ·
  [機器人學](/learn/behavior-trees-in-robotics/) ·
  [Python](/learn/behavior-trees-in-python/)
- [行為樹範例：常見遊戲 AI 模式](/learn/behavior-tree-examples/)
- 準備好寫程式了嗎？[如何從零開始實作行為樹](/learn/how-to-implement-a-behavior-tree/)