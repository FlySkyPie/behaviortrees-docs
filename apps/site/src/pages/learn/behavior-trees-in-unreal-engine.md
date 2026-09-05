---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "Unreal Engine 中的行為樹：UE 內建系統的運作方式"
description: "Unreal Engine 原生內建行為樹。了解 UE 的行為樹、黑版、任務、裝飾器與服務如何搭配運作、UE 的模型與經典行為樹有何不同，以及如何在實作之前先設計樹狀結構。"
pubDate: "2026-07-20"
order: 7
---
lang: zh_TW

# Unreal Engine 中的行為樹

<div class="disclosure">揭露：本頁部分連結為聯盟行銷連結。若您透過這些連結購買商品，我們可能獲得少許佣金，且不增加您的額外費用。</div>

與 Unity 不同，**Unreal Engine 將行為樹作為一級引擎功能原生內建**——這是 Epic 內部使用的同一套系統，整合了 AI 控制器、黑版與環境查詢系統（EQS）。如果您在 UE 中建構 AI，行為樹不只是眾多選項之一；它們是官方鋪好的道路。

本指南說明各項元件，以及更重要的是——Unreal 的實作方式與[我們的入門教學](/learn/what-is-a-behavior-tree/)中所教授的標準行為樹模型有何**不同**。

## 角色介紹

建構 UE AI 需要四個資產／類別協同運作：

- **AIController**——控制 Pawn 並執行行為樹（`RunBehaviorTree`）。
- **[黑版](/learn/behavior-tree-blackboard/)**——鍵／值儲存空間（目標角色、最後已知位置、逃跑旗標），作為樹的運作記憶體。任務讀寫黑版；裝飾器監聽黑版。
- **行為樹資產**——樹本身，在 UE 的節點圖形編輯器中編輯。
- **任務、裝飾器、服務**——您在 Blueprint 或 C++ 中實作的節點類型。

## UE 的節點類型對照

如果您熟悉經典行為樹詞彙，UE 幾乎是一對一對應：

| 經典概念 | Unreal 對應 |
|-----------------|-------------------|
| Selector / Priority | **Selector** 複合節點 |
| Sequence | **Sequence** 複合節點 |
| Parallel | **Simple Parallel** 複合節點 |
| Action 葉節點 | **Task**（例如 `MoveTo`、`Wait`、自訂 `BTTask_`） |
| Condition | **Decorator**（附加在節點上，控制執行閘門） |
| — 經典中無對應 — | **Service**（在分支活躍時定期執行） |

從標準行為樹轉過來的人常被兩件事困擾：

1. **條件不是葉節點。** 在 UE 中，條件是*附加在*複合節點或任務上的裝飾器，而非子節點。「玩家是否可見？」變成「Chase」分支上的一個黑版裝飾器，控制該分支的執行閘門。
2. **UE 的行為樹是事件驅動的，不是單純逐幀更新。** UE 的裝飾器不是每幀都從根節點重新評估整棵樹，而是*監聽*黑版鍵，並在值改變時中止正在執行的分支（即「Observer Aborts」設定：None / Self / Lower Priority / Both）。語意相同，反應式行為不變，但效能好得多——然而這也意味著優先權搶佔只會發生在您已設定中止行為的地方，而這正是「[為什麼我的樹不切換分支？](/learn/debugging-behavior-trees/)」困惑的第一大來源。

## 最小可用設定

用 UE 術語表示的標準巡邏／追擊敵人：

```text
Root
└── Selector
    ├── [Decorator: Blackboard "TargetActor" is set, Observer Aborts: Lower Priority]
    │   Sequence "Combat"
    │   ├── Task: Move To (TargetActor)
    │   └── Task: Attack
    └── Sequence "Patrol"
        ├── Task: Move To (NextWaypoint)
        ├── Task: Wait 2.0s (±deviation)
        └── Task: Advance waypoint index
```

Selector 上的 **Service** 每約 0.5 秒執行感知檢查並將 `TargetActor` 寫入黑版；observer-abort 裝飾器會在目標出現的瞬間將執行流程從 Patrol 拉出。這個 service+observer 模式就是 UE AI 的典型用法。

（UE 的 AI Perception 元件可以自動更新黑版；EQS 則負責處理空間查詢，例如「找出側翼位置」。在基本的迴圈運作正常後再逐步加入這些功能。）

## 先設計，再建構

UE 的圖形編輯器是*實作*行為樹的地方，但用它來*構思*卻相當笨重——每次實驗都需要建立任務資產與黑版鍵。更快的方式是先在免費的[線上行為樹編輯器](//)中草擬設計：粗略畫出分支、優先權與所需的條件，反覆調整直到邏輯正確，再轉換為 UE 資產（記住，條件要變成裝飾器）。

<a class="try-editor" href="/?example=enemy-patrol">▶ 先草擬一個巡邏／追擊／攻擊樹</a>

## 深入學習

- Epic 官方 [Behavior Tree 文件與快速入門](https://dev.epicgames.com/documentation/en-us/unreal-engine/behavior-trees-in-unreal-engine) 確實寫得不錯——在建立自己的樹之前，先跟著快速入門做一遍。
- 關於底層理論（為什麼使用行為樹、效用混合系統、形式語意），**Ian Millington 的 *AI for Games***
  ([Amazon](https://www.amazon.com/s?k=AI+for+Games+Ian+Millington&tag=behaviortrees-20))
  以及免費的 [Game AI Pro 章節](https://www.gameaipro.com/) 是標準參考資料。

## 相關指南

- [Sequence、Selector 與 Decorator 節點詳解](/learn/behavior-tree-nodes-explained/)
- [行為樹 vs 有限狀態機](/learn/behavior-trees-vs-state-machines/)
- [行為樹範例：常見遊戲 AI 模式](/learn/behavior-tree-examples/)