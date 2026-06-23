# Burger 无法洗血异常分析

## 结论

`Burger` 无法在 AP Reset 窗口中点击 `-MP`，根因不是职业本身，也不是服务端洗血公式错误，而是这个角色的 **属性总账超出了客户端允许的预算**。

客户端在打开 AP Reset 面板时，会先做一轮“属性预算预检”。如果角色当前属性总和超过理论可分配总量，客户端会直接把 HP/MP 相关按钮置灰，因此表现出来就是“无法 `-MP`”。

## 为什么不是职业问题

服务端 `-MP` 的核心检查在 [AssignAPProcessor.java](/F:/IdeaProject/BeiDou-Server/gms-server/src/main/java/org/gms/client/processor/stat/AssignAPProcessor.java)。

对海盗而言，只要满足两类条件即可进入洗点逻辑：

- `hpMpUsed >= 1`
- `maxMp` 不低于职业最小值

因此，“按钮是灰的”这件事本身，并不是服务端判定失败，而是客户端在更早阶段就已经把操作拦掉了。

## 客户端拦截发生在哪里

客户端 AP Reset 面板中，HP/MP 下限检查之前，先有一段“属性预算预检”。

相关反汇编位置：

- [beidou_8c.txt](/F:/IdeaProject/BeiDou-Server/gms-server/target/codex/beidou_8c.txt#L15490)
- [beidou_8c.txt](/F:/IdeaProject/BeiDou-Server/gms-server/target/codex/beidou_8c.txt#L15522)

这里会先比较：

- 角色理论可拥有的总属性点
- 角色当前已经占用的总属性点

如果当前占用值超过理论预算，客户端就会直接禁用 HP/MP 相关控件。

后面的 `-HP` / `-MP` 最小值检查虽然也存在，但在这个异常里不是第一触发点。

相关位置：

- `-HP` 检查： [beidou_8c.txt](/F:/IdeaProject/BeiDou-Server/gms-server/target/codex/beidou_8c.txt#L15616)
- `-MP` 检查： [beidou_8c.txt](/F:/IdeaProject/BeiDou-Server/gms-server/target/codex/beidou_8c.txt#L15624)

## 理算逻辑

### 1. 当前属性总账如何计算

客户端预算预检的核心不是只看四维，而是看“已经占用掉的总 AP”。

计算口径可写成：

`总占用 = STR + DEX + INT + LUK + 剩余AP + hpMpUsed`

其中：

- 四维是已经落到属性上的 AP
- `剩余AP` 是还没分配出去的 AP
- `hpMpUsed` 是曾经用于 HP/MP 的那部分 AP 占用记录

也就是说，客户端不是只看你面板上点了多少四维，而是把这几部分一起算总账。

### 2. 理论预算如何计算

这个项目里，角色理论总预算不是单纯“初始属性 + 升级 AP”，还要算转职时补发的 AP。

相关代码：

- [CharacterFactoryRecipe.java](/F:/IdeaProject/BeiDou-Server/gms-server/src/main/java/org/gms/client/creator/CharacterFactoryRecipe.java)
- [Character.java](/F:/IdeaProject/BeiDou-Server/gms-server/src/main/java/org/gms/client/Character.java#L1130)

预算逻辑可写成：

`理论总预算 = 初始属性总和 + 升级获得 AP + 转职补发 AP`

在这套逻辑里：

- 初始基础属性总和为固定起点
- 每升一级获得固定 AP
- 某些转职阶段还会额外补发 AP

因此，只要角色历史上某次操作让“实际占用总和”高于“理论预算”，客户端就会把这个角色判成异常状态。

### 3. 为什么会只影响一个角色

因为这个判定是按“角色当前属性总账”逐个判断的，不是按账号统一判断，也不是按职业统一判断。

所以：

- 其它角色预算正常，就不会出问题
- `Burger` 如果总账超出预算，就只有它会在 AP Reset 面板里出现灰按钮

## 服务端与客户端在这次异常中的分工

这次问题里，服务端和客户端扮演的角色不同：

- 服务端负责真正执行 `-MP` / `+HP`
- 客户端负责先决定哪些按钮可点

这意味着：

- 服务端公式正确，不代表客户端一定允许你点
- 只要客户端预算预检没过，就算服务端本来会放行，你也发不出那次操作

## 关于排查中的一个干扰点

排查时还观察到过 `hp/mp` 与 `maxhp/maxmp` 的显示关系异常。

这个现象在本项目里不能单独作为最终根因，因为服务端区分：

- 基础 `maxHp/maxMp`
- 带装备后的 `localMaxHp/localMaxMp`

相关代码：

- [AbstractCharacterObject.java](/F:/IdeaProject/BeiDou-Server/gms-server/src/main/java/org/gms/client/AbstractCharacterObject.java#L261)
- [Character.java](/F:/IdeaProject/BeiDou-Server/gms-server/src/main/java/org/gms/client/Character.java#L6825)
- [Character.java](/F:/IdeaProject/BeiDou-Server/gms-server/src/main/java/org/gms/client/Character.java#L6994)

所以这类现象最多只能作为旁证，不能直接推出“这就是无法洗血的唯一原因”。

真正锁定问题的依据，仍然是：

**该角色的属性总账超出了客户端预算，导致客户端在 AP Reset 面板初始化阶段直接禁用了 HP/MP 按钮。**

## 最终判断

把整条链路压缩成一句话：

**`Burger` 不是因为职业不能洗血，而是因为角色属性总账异常，客户端先把 HP/MP 按钮灰掉了，所以看起来像“无法 -MP”。**
