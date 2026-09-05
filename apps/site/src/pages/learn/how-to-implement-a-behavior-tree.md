---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "如何從零撰寫行為樹（約100行）"
description: "自己動手實作一個可運行的行為樹執行核心：狀態列舉、序列節點、選擇節點、記憶體變體及裝飾器，以約100行 TypeScript 完成，且可直接移植到 C#、GDScript 或 C++。"
pubDate: "2026-07-28"
order: 13
---
lang: zh_TW

# 如何從零撰寫行為樹

行為樹執行核心的核心程式碼向來非常精簡——親自寫一個是**真正**理解 tick 語意的最佳方式。本指南將以約 100 行 TypeScript 建構一個完整且可運作的核心。它幾乎可以逐行移植到 C#、GDScript 或 C++，沒有任何語言特定之處。（若你對序列與選擇節點還不熟悉，請先閱讀[節點參考文件](/learn/behavior-tree-nodes-explained/)——本文實作的正是該文件所描述的內容。）

## 契約：一個方法，三種結果

每個節點都有一個 `tick()` 方法，並回傳三種狀態之一：

```ts
enum Status { Success, Failure, Running }

interface Node {
  tick(agent: Agent): Status;
}
```

葉節點執行具體工作；複合節點負責路由 tick。這就是整個架構。

## 葉節點：條件與動作

```ts
class Condition implements Node {
  constructor(private check: (agent: Agent) => boolean) {}
  tick(agent: Agent): Status {
    return this.check(agent) ? Status.Success : Status.Failure;
  }
}

class Action implements Node {
  constructor(private act: (agent: Agent) => Status) {}
  tick(agent: Agent): Status {
    return this.act(agent);
  }
}
```

`Action` 回呼回傳 `Status` 而非 `boolean` 這一點至關重要：尚未抵達目標的 `moveTo` 會回傳 `Running`，讓行為樹繼續等待。忽略 `Running` 是[經典錯誤 #5](/learn/debugging-behavior-trees/)。

## 複合節點：序列與選擇

```ts
class Sequence implements Node {
  constructor(private children: Node[]) {}
  tick(agent: Agent): Status {
    for (const child of this.children) {
      const status = child.tick(agent);
      if (status !== Status.Success) return status;  // Failure 或 Running 會中止遍歷
    }
    return Status.Success;
  }
}

class Selector implements Node {
  constructor(private children: Node[]) {}
  tick(agent: Agent): Status {
    for (const child of this.children) {
      const status = child.tick(agent);
      if (status !== Status.Failure) return status;  // Success 或 Running 會中止遍歷
    }
    return Status.Failure;
  }
}
```

注意它們是鏡像關係——序列在非 Success 時跳出，選擇在非 Failure 時跳出。每次 tick 都從第零個子節點重新開始遍歷，這正是它們具備**反應性**的原因：優先權較高的選擇分支一旦其條件通過，就能立即奪回控制權。

## 記憶體變體與裝飾器

記憶體序列會從上次中斷處繼續執行，而非重新開始——這是程序性檢查清單的解決方案：

```ts
class MemSequence implements Node {
  private current = 0;
  constructor(private children: Node[]) {}
  tick(agent: Agent): Status {
    while (this.current < this.children.length) {
      const status = this.children[this.current].tick(agent);
      if (status === Status.Running) return status;
      if (status === Status.Failure) { this.current = 0; return status; }
      this.current++;
    }
    this.current = 0;
    return Status.Success;
  }
}
```

裝飾器包裹一個子節點並轉換其結果：

```ts
class Inverter implements Node {
  constructor(private child: Node) {}
  tick(agent: Agent): Status {
    const status = this.child.tick(agent);
    if (status === Status.Success) return Status.Failure;
    if (status === Status.Failure) return Status.Success;
    return Status.Running;
  }
}
```

`Repeater`、`UntilSuccess`、`Cooldown` 等均以相同模式撰寫，每個只需 5–10 行。

## 組裝與執行

以下是[巡邏／追擊／攻擊階梯](/learn/behavior-tree-examples/)的原文範例：

```ts
const brain = new Selector([
  new Sequence([new Condition(inRange), new Action(attack)]),
  new Sequence([new Condition(canSee),  new Action(chase)]),
  new MemSequence([new Action(moveToWaypoint), new Action(wait2s), new Action(nextWaypoint)]),
]);

// 遊戲主迴圈
for (const agent of agents) brain.tick(agent);
```

這就是一個可運作的行為樹。總計：約 100 行。

## 正式產品會額外加入什麼（以及為何不該手寫行為樹）

有三大要素將上述程式碼與正式產品級執行核心區別開來：

1. **黑板（[Blackboard](/learn/behavior-tree-blackboard/)）。** 注意上方有一個不易察覺的錯誤：`MemSequence` 將 `current` 儲存在節點實例上，因此**在多個代理之間共用同一棵行為樹會導致錯誤**。正式產品級執行核心會將每個節點的狀態存放在每個代理各自的黑板中（`blackboard.get(key, treeId, nodeId)`），讓行為樹本身保持無狀態且可共用。
2. **進入／退出鉤子（Enter/Exit Hooks）。** 當上層分支搶佔一個正在執行中的動作時，該動作需要一個 `onExit`/`halt` 回呼來停止動畫、取消路徑請求、釋放已佔用的資源。中斷清理是實際執行核心中最困難的 20%。
3. **資料驅動的行為樹。** 以程式碼建構行為樹（如上方片段）會將你的 AI 設計深埋在一個個建構子呼叫中。正式產品流程會從資料載入行為樹——這正是[免費線上編輯器](/)所匯出的功能：behavior3 格式的 JSON，包含節點、屬性及子節點資訊，並搭配一個將節點名稱對應到你的類別的載入器。

以視覺化方式設計行為樹，匯出 JSON，然後讓你那百行程式碼來執行它：

<a class="try-editor" href="/?example=enemy-patrol">▶ 開啟本文實作的行為樹</a>

## 相關指南

- [序列、選擇與裝飾器節點詳解](/learn/behavior-tree-nodes-explained/)
- [行為樹除錯](/learn/debugging-behavior-trees/)
- [Python 中的行為樹](/learn/behavior-trees-in-python/)——使用 py_trees 進行同樣的練習