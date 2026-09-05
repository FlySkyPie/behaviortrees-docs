---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "行為樹在機器人領域的應用：BehaviorTree.CPP、ROS 2 與 Nav2"
description: "為什麼機器人領域從遊戲業界引入了行為樹——以及 BehaviorTree.CPP、ROS 2 和 Nav2 導航棧如今如何使用它們，並說明與遊戲風格行為樹的主要差異。"
pubDate: "2026-07-20"
order: 9
---
lang: zh_TW

# 行為樹在機器人領域

<div class="disclosure">免責聲明：本頁的部分連結為聯盟行銷連結。若您透過這些連結購買商品，我們可能在不增加您額外費用的情況下獲得佣金。</div>

行為樹誕生於遊戲產業，但它們的第二職業可以說更為重要：它們已成為機器人領域標準的任務編排架構。ROS 2 **Nav2** 導航棧——運行於數千台真實機器人之上——由行為樹驅動，而 **BehaviorTree.CPP** 已成為機器人任務邏輯的事實標準 C++ 函式庫。

如果您來自遊戲開發領域，這些概念可以直接轉移過來（需要的話請參閱[簡介](/learn/what-is-a-behavior-tree/)）。本指南涵蓋在真實硬體上的差異，以及您現今會使用的具體技術棧。

## 為什麼機器人領域從狀態機轉型

機器人任務邏輯傳統上使用 FSM（ROS 1 中的 SMACH、FlexBE）。推動這波遷移的痛點與[遊戲開發的比較](/learn/behavior-trees-vs-state-machines/)相似，另外還有兩個機器人領域特有的原因：

- **處處需要復通行為。** 真實機器人持續故障——夾取滑脫、路徑受阻、感測器斷線。BT 原生地以選擇器和重試裝飾器來表達「先試這個，失敗就試這些備案」，無需在每個狀態中配置復通轉換邏輯。
- **形式化可分析性。** 機器人領域重視可驗證的屬性（安全性、穩健性）。其學術基礎——Colledanchise 與 Ögren 的研究——建立了 BT 是幾種經典控制架構的推廣形式，為業界標準化提供了理論依據。

## BehaviorTree.CPP：主力工具

[BehaviorTree.CPP](https://www.behaviortree.dev/)（由 Davide Faconti 開發）是一個 C++ 函式庫，其中樹以 **XML** 定義，葉節點則是以名稱註冊的 C++ 類別：

```xml
<root BTCPP_format="4">
  <BehaviorTree ID="PickAndPlace">
    <Sequence>
      <Fallback>
        <Condition ID="IsHoldingObject"/>
        <Sequence>
          <Action ID="MoveToObject"/>
          <RetryUntilSuccessful num_attempts="3">
            <Action ID="GraspObject"/>
          </RetryUntilSuccessful>
        </Sequence>
      </Fallback>
      <Action ID="MoveToTarget"/>
      <Action ID="PlaceObject"/>
    </Sequence>
  </BehaviorTree>
</root>
```

請注意其用語：機器人領域稱之為 **Fallback**，而遊戲領域則稱 Selector/Priority；BT.CPP 區分了同步行為與長時間執行的**有狀態/非同步行為**（相當於回傳 `Running`）。它附帶 **Groot2**，一個可透過網路連線監控即時樹的視覺化編輯器/監控工具——相當於機器人領域的除錯器，而且您從第一天就會想要使用。

<a class="try-editor" href="/?example=robot-pick-and-place">▶ 互動式探索這棵夾取與放置樹</a>

## ROS 2 與 Nav2：生產環境中的行為樹

**Nav2**，ROS 2 導航框架，是機器人領域最高調的行為樹部署案例。其預設的「導航到姿勢」邏輯是一棵可讀取且可自訂的行為樹 XML：計算路徑（含重試與速率限制）、跟隨路徑，並在失敗時依備用順序執行復通分支——清除成本地圖、原地旋轉、後退、等待。

<a class="try-editor" href="/?example=robot-navigate-recovery">▶ 探索一棵 Nav2 風格的含復通導航樹</a>

實務上的超強優勢：**改變機器人行爲只需編輯 XML 樹，無需重新編譯節點圖。** 希望機器人在後退前嘗試重新規劃五次？編輯樹即可。車隊營運人員就是這樣調整每個站點的行為。

對於操作與完整任務邏輯（巡邏→檢查→停靠→充電），團隊以同樣的方式組合 BT.CPP 子樹——子樹重複使用自然地對應到機器人所公開的「技能」。

## 遊戲樹 vs 機器人樹：實際差異

| 面向 | 遊戲 | 機器人 |
|--------|-------|----------|
| Tick 來源 | 幀循環（30–60 Hz） | 明確的速率，通常每棵樹 10–100 Hz |
| 葉節點對接 | 引擎/遊戲邏輯程式碼 | ROS 動作/服務、硬體驅動程式 |
| 失敗 | 設計上的一種情況 | *常見*情況——復通才是重點 |
| 長時間行為 | 動畫長度 | 數秒到數分鐘（非同步是必須的） |
| 編寫格式 | 編輯器專屬 JSON / 引擎資產 | XML（BT.CPP），常手動編輯 |
| 驗證 | 遊玩測試 | 模擬 + 形式化分析文化 |

## 學習路徑

1. **書籍：** *Behavior Trees in Robotics and AI: An Introduction*，Michele Colledanchise 與 Petter Ögren 合著——權威之作，嚴謹且易讀；作者們在 [arXiv 上維護免費預印本](https://arxiv.org/abs/1709.00084)（[亞馬遜印刷版](https://www.amazon.com/s?k=Behavior+Trees+in+Robotics+and+AI&tag=behaviortrees-20)）。
2. **動手實作：** 完成 [BehaviorTree.CPP 教學](https://www.behaviortree.dev/docs/intro)，然後閱讀 Nav2 的預設行為樹 XML——它們簡短且符合生產標準。
3. **設計練習：** 在免費的[線上行為樹編輯器](/)中草擬您的任務邏輯，然後再提交為 XML——在草稿階段修正結構錯誤的成本遠低於後期修改。

## 相關指南

- [什麼是行為樹？](/learn/what-is-a-behavior-tree/)
- [Sequence、Selector 與 Decorator 節點解說](/learn/behavior-tree-nodes-explained/)
- [行為樹 vs 有限狀態機](/learn/behavior-trees-vs-state-machines/)
- 偏愛 Python？[Python 中的行為樹：py_trees](/learn/behavior-trees-in-python/)