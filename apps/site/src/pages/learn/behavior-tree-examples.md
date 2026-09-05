---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "行為樹範例：5 種常見遊戲 AI 模式"
description: "可實際操作的行為樹範例，您能在免費線上編輯器中開啟：巡邏／追逐／攻擊敵人、守衛據點、低血量逃脫、重試迴圈與冷卻限制的特殊攻擊。"
pubDate: "2026-07-20"
order: 11
---
lang: zh_TW

# 行為樹範例：常見遊戲 AI 模式

大多數遊戲 AI 實際上是由一組數量驚人地少且重複出現的樹形結構所組成。本頁
整理了您會不斷重複使用的模式，以樹狀圖形式呈現，您可以直接在此閱讀，並在
[免費線上編輯器](/) 中開啟並修改。如果對任何符號不熟悉，請參閱
[節點參考](/learn/behavior-tree-nodes-explained/)。

## 1. 優先級階梯：巡邏 / 追逐 / 攻擊

最基本的敵人生成模式——一個根選擇器，其子節點按優先級遞減排列的完整行為：

```text
Selector "敵人大腦"
├── Sequence "攻擊"   : 玩家在範圍內？ → 攻擊玩家
├── Sequence "追逐"   : 玩家可看見？  → 移動向玩家
└── Sequence "巡邏"   : 移動到路徑點 → 等待 → 下一個路徑點
```

<a class="try-editor" href="/?example=enemy-patrol">▶ 在編輯器中開啟此樹</a>

每個分支都由其條件進行*守衛*；哪個守衛先通過，該分支就獲得該次 tick。
最底層的分支沒有守衛——它是無條件的備用方案，因此樹永遠不會直接失敗。
幾乎每個遊戲類型中的敵人都只是這個階梯換上不同的階層而已。

## 2. 守衛備用鏈：升級策略

當一個目標有多種達成方式時，將策略按成本最低優先的順序放在選擇器下——經典的「開門」教學範例：

```text
Selector "進入房間"
├── Sequence: 門是否開著？ → 走過去
├── Sequence: 有鑰匙嗎？ → 解鎖 → 開門 → 走過去
└── Sequence: 破門 → 走過去
```

<a class="try-editor" href="/?example=open-the-door">▶ 在編輯器中開啟此樹</a>

這與機器人用於復原行為的結構相同——請參閱
[機器人學中的行為樹](/learn/behavior-trees-in-robotics/)——重新規劃，接著
清除感測器地圖，然後後退，依升級順序進行。
[導航含復原範例](/?example=robot-navigate-recovery) 正是如此，
以 ROS 2 Nav2 堆疊為模型。

## 3. 生存覆蓋

加入一個最高優先級的分支，當關鍵資源不足時可搶先中斷所有行為：

```text
Selector "大腦"
├── Sequence "生存"              ← 始終優先評估
│   ├── 血量是否過低？
│   └── Selector: 逃向掩護 | 使用治療道具 | 背水一戰
├── ...一般戰鬥階梯...
```

<a class="try-editor" href="/?example=survival-override">▶ 在編輯器中開啟此樹</a>

由於選擇器每個 tick 都會重新評估，代理人在血量下降的瞬間就會*放棄*任何
較低層的分支——無需任何轉換。（正是這個模式讓行為樹在中斷處理上勝過
狀態機；請參閱[比較說明](/learn/behavior-trees-vs-state-machines/)。）
如果在戰鬥分支中希望在逃跑時停止攻擊，可以在 `血量是否過低？` 加上反相器。

## 4. 含上限的重試

將不穩定的動作包裝在重試裝飾器中，而不是在程式碼中進行迴圈：

```text
Sequence "取得物件"
├── 移動到物件
└── RepeatUntilSuccess (最多 3 次)
    └── 抓取物件
```

<a class="try-editor" href="/?example=robot-pick-and-place">▶ 在拾放樹中查看完整範例</a>

這個模式可以組合：`RepeatUntilSuccess` 包住單一抓取動作，放在一個先重新定位的
序列中，再放在一個重試耗盡後放棄並請求協助的選擇器中。每個錯誤處理層級
都直接顯示在結構中，而非隱藏在程式碼裡。

## 5. 冷卻限制的特殊攻擊

選擇器會依序嘗試子節點，因此昂貴／華麗的攻擊優先，並透過冷卻時間或資源裝飾器
進行限制：

```text
Selector "選擇攻擊"
├── Limiter/Cooldown (10秒) → Sequence: 在範圍內？ → 發射火箭
├── Sequence: 有彈藥嗎？ → 射擊
└── 近戰攻擊
```

<a class="try-editor" href="/?example=cooldown-specials">▶ 在編輯器中開啟此樹</a>

AI 會自動「偏好」特殊攻擊（只要條件允許），並優雅地降級為基本攻擊——
設計師透過重新排序子節點和調整冷卻時間來調控感受，無需觸碰程式碼。
（請將冷卻時間掛在*序列*上，而非條件上，否則範圍檢查失敗時冷卻計時器
仍會啟動。）

## 組合應用

真實的代理人就是這五種模式的嵌套組合：頂層是生存覆蓋，底下是優先級階梯，
每個階層內有備用鏈，不可靠的動作周圍有重試機制，特殊攻擊上有冷卻限制。
由於每種模式都是一個自包含的子樹，您可以獨立建構並測試它們，然後再
嫁接組合在一起——隨著組合規模增長，保持可讀性的技巧在
[建構大型行為樹](/learn/structuring-large-behavior-trees/) 中有詳細說明。

在[行為樹編輯器](/) 中建立您自己的樹——從敵人的範例開始，加入
生存分支，然後匯出 JSON 到 [Unity](/learn/behavior-trees-in-unity/)、
[Unreal](/learn/behavior-trees-in-unreal-engine/) 或您自己的引擎。

<a class="try-editor" href="/?example=enemy-patrol">▶ 開始建構</a>