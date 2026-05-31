# Charlie NPC（2010000）兑换异常分析报告

- 报告时间：2026-04-20
- 范围：仅分析与验证，不修改业务代码
- 目标：结合 `application.yml` 的数据库配置，基于账号 `787131450` 的实库数据，确认“兑换多次后 Other/其他 栏出现无图标且数量为 0 物品”的根因，并给出修复方案

## 1. 结论摘要

本问题已被数据库数据和代码链路共同证实，主因是 Charlie NPC 奖励表配置了错误物品 `4010008`（应为 `4020008`）。

该错误 ID 在资源侧不存在，导致服务端计算 `slotMax=0`。在发奖流程中，`addFromDropInternal` 对 `slotMax=0` 缺少防御，循环插入大量 `quantity=0` 的物品记录，直到背包满为止。客户端无法解析该错误物品图标和名称，最终表现为“其他栏出现一堆空白图标，数量 0”。

同时还存在次要脚本错误：`[4020008.2]`（数组结构和数值均异常），可能触发随机奖励异常。

## 2. 证据链

## 2.1 配置与连接来源

数据库连接信息来自：
- `F:\IdeaProject\BeiDou-Server\gms-server\src\main\resources\application.yml`

关键配置：
- host: `192.168.100.10`
- port: `3306`
- database: `beidou`
- username: `root`
- password: `000111.a`

## 2.2 脚本层证据（Charlie NPC）

文件：
- `F:\IdeaProject\BeiDou-Server\gms-server\scripts\npc\2010000.js`
- `F:\IdeaProject\BeiDou-Server\gms-server\scripts-zh-CN\npc\2010000.js`

异常点：
1. 错误奖励 ID（主因）
- 第 162 行：`[4010008, 4], // Black Crystal Ore`
- 注释写的是 Black Crystal Ore，对应正确 ID 应为 `4020008`。

2. 格式错误（次因）
- 第 109 行：`[4020008.2], // Black Crystal Ore`
- 这里应为二维奖励对 `[itemId, quantity]`，当前写法会导致 `prizeQuantity` 异常。

发奖调用：
- 第 205-207 行：
  - `cm.gainItem(requiredItem, -100);`
  - `cm.gainItem(prizeItem, prizeQuantity);`

## 2.3 资源侧证据（4010008 不存在）

在服务端资源与手册中：
- `4020008` 可查到（例如 `wz\String.wz\Etc.img.xml`、`wz-zh-CN\String.wz\Etc.img.xml`、`handbook\Etc.txt`）
- `4010008` 未在 `wz` / `wz-zh-CN` / `handbook` 中查到对应条目

说明：`4010008` 不是有效的 Black Crystal Ore 物品 ID。

## 2.4 服务端代码链路证据

1. 脚本发奖进入 `gainItem`
- `src\main\java\org\gms\scripting\AbstractPlayerInteraction.java:594`
- 非装备分支创建 `new Item(id, ..., quantity, ...)`，随后调用：
- `InventoryManipulator.addFromDrop(...)`（约 662 行）

2. `slotMax` 计算
- `src\main\java\org\gms\server\ItemInformationProvider.java:360`
- `getSlotMax` 中，若 `getItemData(itemId)` 为空，则 `ret` 保持 `0` 返回

3. 写入 0 数量记录的关键逻辑
- `src\main\java\org\gms\client\inventory\manipulator\InventoryManipulator.java:195`
- `addFromDropInternal` 在 `while (quantity > 0)` 中：
  - `newQ = min(quantity, slotMax)`
  - 当 `slotMax=0` 时，`newQ=0`
  - 仍执行 `new Item(itemid, ..., newQ, ...)` 并 `inv.addItem(nItem)`
- 结果是持续新增 `quantity=0` 的记录，直到 `inv.addItem` 返回 `-1`（背包满）才中止。

补充：
- `addByIdInternal`（约 111-134 行）已有 `newQ==0` 防御返回；
- `addFromDropInternal` 缺少同等防御，这是本次脏数据落库的关键缺口。

## 2.5 数据库实证（账号 787131450）

### 账号与角色

账号：
- `accounts.name = '787131450'`
- 结果：`id=112, characterslots=3, loggedin=2`

角色（`accountid=112`）：
- `id=184, name='1234', etcslots=96`
- `id=185, name='Charon'`
- `id=209, name='롬댐'`

### 异常库存（核心证据）

针对角色 `184`：
- `inventoryitems` 中存在 `92` 条 `itemid=4010008 AND quantity=0`
- `inventorytype=4`（ETC/其他）
- `position` 连续分布 `2..93`

同角色 ETC 关键分布：
- `position=1`：`itemid=4000080, quantity=38`（兑换材料）
- `position=2..93`：`itemid=4010008, quantity=0`（异常堆积）
- `position=94..96` 还有正常 ETC 物品

全库观测：
- `quantity=0` 总记录数：`102`
- 其中 `itemid=4010008` 占 `92`（最大来源）

以上与“前几次正常，4-5 次后 Other 栏被空白 0 数量物品塞满”的玩家反馈高度一致。

## 3. 复现机理（从脚本到客户端表现）

1. 玩家与 Charlie 兑换，命中奖励池中错误项 `[4010008, 4]`
2. `cm.gainItem(4010008, 4)` 进入发奖流程
3. 因 `4010008` 资源不存在，`getSlotMax` 返回 `0`
4. `addFromDropInternal` 未拦截 `slotMax<=0`，不断落库 `quantity=0` 新物品
5. 直到 ETC 背包被占满，过程停止
6. 客户端因无该 ID 图标/字符串资源，显示为空白图标且数量 `0`

## 4. 修复方案

## 4.1 P0：脚本数据修正（必须）

同时修改以下两个文件：
- `scripts/npc/2010000.js`
- `scripts-zh-CN/npc/2010000.js`

修改项：
1. `line 162`：`[4010008, 4]` -> `[4020008, 4]`
2. `line 109`：`[4020008.2]` -> `[4020008, 2]`

说明：这一步是问题止血的最小改动。

## 4.2 P1：服务端防御（强烈建议）

在 `InventoryManipulator.addFromDropInternal` 增加保护：
1. 当 `slotMax <= 0` 时直接拒绝发放并记录错误日志（包含 `itemId`、`characterId`、调用来源）
2. 当 `newQ <= 0` 时立即返回失败，禁止 `inv.addItem`
3. 可选：在 `gainItem` 入口增加 `itemId` 有效性校验（资源不存在则拒绝并告警）

价值：即使脚本再出现错误 ID，也不会再生成 0 数量脏数据。

## 4.3 P2：存量脏数据清理（上线前/后均可执行）

先让角色离线，再清理，避免在线缓存回写覆盖。

按本账号定点清理：
```sql
DELETE FROM inventoryitems
WHERE characterid = 184
  AND itemid = 4010008
  AND quantity = 0;
```

全服同类清理（谨慎，先备份）：
```sql
DELETE FROM inventoryitems
WHERE itemid = 4010008
  AND quantity = 0;
```

清理后复核：
```sql
SELECT characterid, itemid, quantity, COUNT(*) AS cnt
FROM inventoryitems
WHERE quantity = 0
GROUP BY characterid, itemid, quantity
ORDER BY cnt DESC;
```

## 5. 验证方案（回归）

1. 用测试号连续兑换 Charlie 20-50 次，确认不再出现空白图标
2. SQL 验证无新增 `itemid=4010008 AND quantity=0`
3. 抽检 `inventoryitems.quantity=0` 总量是否稳定或下降
4. 对脚本奖励池做一次全量校验（itemId 合法、结构为 `[id, qty]`、qty>0）

## 6. 长期建议

1. 新增脚本静态校验工具（发布前扫描所有 `scripts/**/*.js`）：
- 奖励数组必须是 `[int, int]`
- `itemId` 必须存在于物品资源
- `quantity` 必须 `>0`

2. 增加数据库巡检任务（例如每小时）：
```sql
SELECT itemid, COUNT(*) AS cnt
FROM inventoryitems
WHERE quantity = 0
GROUP BY itemid
ORDER BY cnt DESC;
```

3. 在发奖链路加统一告警：
- 发现无效 itemId
- 发现 `slotMax<=0`
- 发现将写入 `quantity<=0`

4. 建议补一条回归测试用例：
- 模拟脚本传入无效 itemId，断言不会写入背包记录。

## 7. 本次分析执行说明

- 已完成：配置核对、脚本核对、服务端代码链路核对、账号 `787131450` 实库数据核对
- 未执行：业务代码修复、数据库删除操作（仅给出可执行方案）

## 8. GitHub 横向对照（2010000.js）

结论：`4010008` 基本可以判定为**误写**。但它是“被大量仓库继承/复制”的误写，而不是本项目独有。

### 8.1 跨仓库检索结果（Sourcegraph 全局索引）

检索口径：`context:global file:2010000.js`

- `4010008,4`：命中 `10` 条（`8` 个仓库）
- `4010008`：命中 `14` 条（`11` 个仓库）
- `4020008.2`：命中 `14` 条（`11` 个仓库）
- `4020008,4`：命中 `0` 条

这说明：
1. 同名脚本在多个仓库里同时存在 `4010008` 和 `4020008.2` 两个典型错误。
2. 这些错误很可能来自同一历史脚本模板的长期传播。
3. “很多仓库都这么写”并不代表正确，只代表该错误传播面广。

### 8.2 抽样仓库（可直接查看）

以下仓库的 `2010000.js` 与本项目同样包含：
- 多处 `[4020008,2]`
- 1 处 `[4020008.2]`
- 1 处 `[4010008,4]`

示例：
- https://github.com/icelemon1314/mapleLemon/blob/master/scripts/npc/2010000.js
- https://github.com/MapleStoryA/orion-server/blob/main/server/config/scripts/npc/2010000.js
- https://github.com/akhuting/gms083/blob/master/src/main/resources/scripts/npc/2010000.js

另外也有改写版本明确使用 `4020008`（未见 `4010008`）：
- https://github.com/Bratah123/ElectronMS/blob/master/ElectronMS/scripts/npc/2010000.js

### 8.3 与本项目结论的关系

GitHub 横向结果与本报告前述根因一致：
- `4010008` 是错误 ID（资源侧不存在）
- `4020008` 才是 Black Crystal Ore
- `4020008.2` 属于奖励数组格式/数值写错

因此本项目修复方向不变：脚本改正 + 服务端防御 + 脏数据清理。
