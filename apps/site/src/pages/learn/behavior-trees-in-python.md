---
lang: zh_TW
layout: ../../layouts/ArticleLayout.astro
title: "Python 中的行為樹：py_trees、ROS 2 與快速原型"
description: "如何使用 py_trees 在 Python 中建構行為樹——行為節點、組合節點、黑板與 ASCII 視覺化——以及適用於 ROS 2 機器人的 py_trees_ros，還有 Python 何時是（以及何時不是）合適的執行環境。"
pubDate: "2026-07-28"
order: 10
---
lang: zh_TW

# Python 中的行為樹

Python 不會為你的 60 fps 動作遊戲驅動敵人的行為——但對於機器人學、模擬、代理原型，以及**學習行為樹的實際運作原理**來說，它生來就是絕佳選擇。這個生態系統有一套明確的標準函式庫 **py_trees**，以及一個一流的 ROS 2 配套函式庫 **py_trees_ros**，兩者與[行為樹在機器人學中的應用](/learn/behavior-trees-in-robotics/)中所介紹的 ROS 導航功能出自同源。

## 五分鐘快速認識 py_trees

py_trees 的一切都由 `Behaviour` 構成，其 `update()` 方法會回傳一個狀態——與[節點參考](/learn/behavior-tree-nodes-explained/)中相同的 Success/Failure/Running 合約：

```python
import py_trees

class IsPlayerVisible(py_trees.behaviour.Behaviour):
    def update(self):
        return (py_trees.common.Status.SUCCESS
                if self.blackboard.visible
                else py_trees.common.Status.FAILURE)

class MoveToPlayer(py_trees.behaviour.Behaviour):
    def update(self):
        arrived = step_toward(self.blackboard.player_position)
        return (py_trees.common.Status.SUCCESS if arrived
                else py_trees.common.Status.RUNNING)

chase = py_trees.composites.Sequence("Chase", memory=False)
chase.add_children([IsPlayerVisible("Visible?"), MoveToPlayer("Move")])

root = py_trees.composites.Selector("Brain", memory=False)
root.add_children([chase, build_patrol_subtree()])

tree = py_trees.trees.BehaviourTree(root)
while True:
    tree.tick()
```

各個元件直接對應到標準 BT 詞彙：

| 概念 | py_trees |
|---------|----------|
| Sequence / Selector | `composites.Sequence` / `composites.Selector` |
| 記憶體變體 | 同一類別，設定 `memory=True` |
| Parallel | `composites.Parallel` 搭配成功策略 |
| 裝飾節點 | `decorators.Inverter`、`Retry`、`Timeout`、`OneShot`、…… |
| [黑板](/learn/behavior-tree-blackboard/) | `blackboard.Client`，支援每個鍵的讀寫註冊 |
| 長時間執行的動作 | 回傳 `RUNNING`；進入/離開時觸發 `initialise()` / `terminate()` 鉤子 |

有兩個細節做得特別出色。**黑板要求行為節點註冊它們讀取和寫入的鍵**——這正是[黑板指南](/learn/behavior-tree-blackboard/)中所提倡的「將鍵視為 API」的紀律，並由函式庫強制執行。此外，**視覺化功能內建其中**：`py_trees.display.ascii_tree(root)` 會列印出帶有即時節點狀態的樹狀圖，讓 tick 語義變得一目瞭然，遠勝於單純閱讀文件。

```text
[o] Brain [*]
    [-] Chase [*]
        --> Visible? [o]
        --> Move [*]      ← Running
    [-] Patrol
```

## py_trees_ros：在真實機器人上運行的行為樹

對於 ROS 2，**py_trees_ros** 以機器人學必備功能包裝了相同的核心：能以非同步方式呼叫 ROS action 和 service 的行為節點、能將主題內容鏡像到黑板的訂閱者，以及用於快照發佈的機制，讓 **py_trees_ros_viewer** GUI 可以透過網路監控即時的行為樹——這與 Groot2 為 BehaviorTree.CPP 提供的「觀看行為樹運行」工作流程相同。Python 的 tick 頻率（任務邏輯通常為 10–50 Hz）對任務編排來說不成問題；真正的硬即時控制迴圈無論如何都位於樹下方的控制器中。

如果你的技術棧是 C++/Nav2，請使用 [BehaviorTree.CPP](/learn/behavior-trees-in-robotics/)；如果是以 Python 為主的技術棧——研究平台、快速現場工具開發、課程作業——py_trees 就是標準選擇。

## 當 Python 不是合適的執行環境時（但它仍然有用）

對於一款上市的遊戲，你會分別在 [Unity](/learn/behavior-trees-in-unity/)、[Unreal](/learn/behavior-trees-in-unreal-engine/) 或 [Godot](/learn/behavior-trees-in-godot/) 中執行行為樹——但一個 50 行的 Python 原型仍然是驗證樹**邏輯**最快的方式，然後再接觸引擎程式碼。用計數器模擬每個動作，在迴圈中 tick 行為樹，印出 ASCII 樹狀圖，然後觀察你的優先級和守衛條件是否真的如你預期般運作。邏輯錯誤在這裡只需花費幾分鐘，而在引擎內部則需要數小時。

設計階段也是如此：先在視覺上勾勒樹的結構，然後再用 Python 實作。

<a class="try-editor" href="/?example=robot-pick-and-place">▶ 在編輯器中探索取放機器人行為樹</a>

## 相關指南

- [行為樹在機器人學中的應用：BehaviorTree.CPP、ROS 2 與 Nav2](/learn/behavior-trees-in-robotics/)
- [如何從零實作行為樹](/learn/how-to-implement-a-behavior-tree/)
- [行為樹黑板](/learn/behavior-tree-blackboard/)