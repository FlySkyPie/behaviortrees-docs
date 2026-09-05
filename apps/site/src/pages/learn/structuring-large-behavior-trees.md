---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "結構化大型行為樹：子樹、重用與規模擴展"
description: "如何在超過30個節點後仍保持行為樹的可讀性 — 優先級分層、萃取子樹、參數化葉節點、命名慣例，以及判斷何時邏輯根本不該放在樹中。"
pubDate: "2026-07-28"
order: 14
---
lang: zh_TW

# 結構化大型行為樹

每棵行為樹一開始都是可讀的。然後頭目需要第二階段，設計師想要嘲諷技能，QA 在懸崖邊發現了邊界案例 — 十八個月後，這棵樹變成了 200 個節點的考古現場。行為樹不會自動擴展；只有當你將寫程式的紀律套用上去時，它們才會擴展。以下技巧能讓大型樹保持清晰可讀，按你需要的順序排列。

## 1. 讓根層級讀起來像目錄

樹的頂層應該只是一個單純的選擇器 (selector)，按照優先級排列*完整、有命名的行為* — 除此之外別無其他：

```text
Selector "Brain"
├── Subtree "Survive"      (血量/彈藥緊急狀況)
├── Subtree "Combat"       (攻擊階梯)
├── Subtree "Investigate"  (聽到了什麼)
├── Subtree "Work"         (Agent 的日常工作)
└── Subtree "Idle"         (無條件後備)
```

任何人 — 包括六個月後的你 — 應該只要看五行就能了解這個 agent 的完整性格。如果原始條件和動作直接暴露在根層級，把它們往下推。[生存覆寫與優先級階梯模式](/learn/behavior-tree-examples/)可以直接套入這個框架。

## 2. 萃取子樹，就像萃取函式

同樣的信號也適用：當一個分支大到可以*命名*時，就把它萃取出來。一個有明確名稱和明確契約的子樹，可以在不閱讀內部實作的情況下被理解、測試和重用 — 將「Take Cover」移植到新 agent 應該只需要改一個地方，就像在[FSM 比較](/learn/behavior-trees-vs-state-machines/)中加入 Flee 分支只是一個修改。

契約部分是大家最容易忽略的。子樹的輸入和輸出是[黑板鍵](/learn/behavior-tree-blackboard/)：「Take Cover」*讀取* `threatPosition`，*寫入* `inCover`。把這份文件寫在子樹旁邊。一個未記錄契約的子樹會與所有使用它的樹產生看不見的耦合 — 機器人框架透過在子樹邊界進行明確的埠對應來解決這個問題 ([BehaviorTree.CPP](/learn/behavior-trees-in-robotics/))，即使你的框架沒有強制要求，也應該模仿這種紀律。

## 3. 保持葉節點少量、通用且可參數化

大型樹通常不是因為*邏輯*龐大而龐大 — 它們龐大是因為葉節點不斷增生。`MoveToPlayer`、`MoveToCover`、`MoveToWaypoint`、`MoveToLeader` 其實就是一個 `MoveTo(targetKey)` 穿了四件不同的戲服。一套精簡且可參數化的葉節點詞彙（對整個遊戲來說，幾十個葉節點是合理的數目）意味著新的行為是新的*排列組合*，而不是新的程式碼 — 設計師可以在沒有程式設計師的情況下建構它們。

命名規範讓樹易於掃讀：**條件用疑問句**（`Is Target Visible?`）、**動作用命令式動詞**（`Reload Weapon`）、**子樹用名詞片語**（`Ranged Attack`）。混亂的命名方式會讓每次閱讀都付出小小的代價。

## 4. 在分支頂部守衛，不要在內部

將每個分支的進入條件放在分支的第一個子節點（或作為裝飾器掛在分支上），而不是散落在分支內部。當讀者想判斷「這個分支跟我的 bug 有關嗎？」時，應該在該分支的第一行就得到答案。內部守衛條件也會在分支處於活躍狀態時的每次 tick 重新執行 — 這正是[附帶副作用的條件 bug](/learn/debugging-behavior-trees/)最愛藏身之處。

## 5. 透過嫁接而非複製來區分 Agent

當狙擊手需要步兵 80% 的腦袋時，不要複製整棵樹 — 共享子樹，組合不同的頂層。共享「Survive」、共享「Investigate」、不同的「Combat」。對共享子樹的修復會立即擴散到所有 agent 類型。（這也是主張將樹視為資料而非程式碼的理由 — 一個子樹檔案，多棵樹引用它。）

## 6. 知道什麼不該放在樹中

縮小一棵樹最快的方法就是移除那些不該存在的東西：

- **動畫與移動細節**屬於動畫狀態機，樹的動作只是*驅動*它 — 「BT 負責決策，FSM 負責執行。」
- **平滑的多向選擇**（「九種攻擊中選哪一種？」）可能需要一個效用評分選擇器，而不是九個手動排序的分支 — 請參考 [BTs vs GOAP vs Utility](/learn/behavior-trees-vs-goap-vs-utility-ai/)。
- **昂貴的感知**屬於按自身排程寫入黑板的感測器，而不是樹中的條件。

一棵只做*決策*的樹會保持足夠小，讓人讀得下去。

## 像測試函式一樣測試子樹

萃取出來的子樹可以獨立執行：模擬它們讀取的黑板鍵、執行 tick、然後驗證它們寫入了什麼。大部分的結構性 bug 在五節點的測試框架中捕捉，比在兩百節點的大腦中便宜得多 — 而當完整樹確實出錯時，[常用的六個嫌疑犯](/learn/debugging-behavior-trees/)仍然適用。

編輯器是體驗這些技巧的好地方：[pick-and-place 範例](/?example=robot-pick-and-place)展示了小規模的守衛與遞增結構，多樹專案則讓你可以先分別繪製子樹，再組合它們。

<a class="try-editor" href="/?example=robot-pick-and-place">▶ 在編輯器中研究結構良好的樹</a>

## 相關指南

- [行為樹範例：常見遊戲 AI 模式](/learn/behavior-tree-examples/)
- [行為樹黑板](/learn/behavior-tree-blackboard/)
- [行為樹除錯](/learn/debugging-behavior-trees/)