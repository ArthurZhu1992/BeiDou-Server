## 背景

宠物拾取反作弊 `PET_ITEM_VAC` / `PET_SHORT_ITEM_VAC` 存在严重的同图传送后误判问题：

1. 玩家在 dw00 打怪 → 物品掉落 dw00
2. 玩家使用内传送门/普通门同图传送至 dw01
3. `MovePet` 包将宠物坐标更新到 dw01
4. 客户端队列中旧位置的 `PetLoot` 包到达服务端
5. pet check 以新位置为基准计算距离 → Y=608 距旧平台物品超阈值 → 误判封号

## 修复方案

两条防护链依次执行：

1. **玩家位置预检**（commit 3）：玩家在物品 800×600 范围内即放行
2. **传送补偿预检**（commit 4-5）：传送前 1.5s 内记录玩家坐标，补偿位置在 800×600 范围内即放行
3. **pet check**：前两条均不满足时执行原始距离检测

## 竞态安全

- `PetLoot` 包在传送前到达 → 玩家预检过
- `PetLoot` 包在传送后到达 → 补偿预检过
- 两个 `PetLoot` 包在传送前后都有 → 总有一条命中

## 提交列表

| # | Commit | 描述 |
|---|--------|------|
| 1 | `cee5fdae6` | 新增 `PET_ITEM_VAC`/`PET_SHORT_ITEM_VAC` 枚举 + `checkPetPickupDistance()` + 玩家捡取改为 `ITEM_VAC` + 中英文 i18n |
| 2 | `c21258353` | 编译修复 `double`→`(int)` |
| 3 | `ad4239572` | 玩家位置预检：玩家在物品 800×600 内直接放行 |
| 4 | `571ba1f4b` | 传送补偿：`InnerPortalHandler` 传送前记录坐标 → `PetLootHandler` 补偿预检，1.5s 超时 |
| 5 | `85fe7f882` | `InnerPortalHandler.readPortalNameSafely()` 跳过标志字节修复 + `GenericPortal.enterPortal` 补偿入口 |
