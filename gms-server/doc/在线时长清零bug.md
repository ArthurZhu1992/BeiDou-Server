• 结论先说：从代码看，“小退后清零”最可能是登录后 5 秒内再次退出导致在线时长被写成 -1，下次登录被判定为负数后重置为 0；另外脚本本身只在打开时读取一次在线时长，如果打开过早（OnlineTimeTask 尚未初始化）会显示为 0/空白，让玩家误以为清零。

可能原因与证据（只分析，不修）：

- 在线时长初始化有 5 秒窗口
  在线时间存在角色内存字段 m_iCurrentOnlineTime，默认 -1，只有 OnlineTimeTask 每 5 秒更新一次。getOnlineTime() 直接返回这个字段。
  相关路径：
    - gms-server/src/main/java/org/gms/client/Character.java
    - gms-server/src/main/java/org/gms/net/server/task/OnlineTimeTask.java
    - gms-server/src/main/java/org/gms/scripting/AbstractPlayerInteraction.java
- “小退”太快会把 -1 写回数据库，导致下次变 0
  退出时 Client.disconnectInternal 会调用 player.updateOnlineTime() 把 m_iCurrentOnlineTime 写入“每日在线时间”。如果退出发生在 OnlineTimeTask 还没跑过的 5 秒内，写入的就是 -1。
  OnlineTimeTask 下次运行读取到 -1 会触发 onlineTime < 0，直接重置为 0。
  相关路径：
    - gms-server/src/main/java/org/gms/client/Client.java
    - gms-server/src/main/java/org/gms/client/Character.java
    - gms-server/src/main/java/org/gms/net/server/task/OnlineTimeTask.java
- 脚本只读取一次在线时长，早打开会显示“被清零”
  在线奖励_nextlevel.js 在 start() 里只读一次 getOnlineMinute()，后续不刷新。若玩家刚登录就打开，在线时长还没被 OnlineTimeTask 初始化，界面就显示 0/空白；即使后面已更新，界面也不会跟着变。
  相关路径：gms-server/scripts-zh-CN/BeiDouSpecial/在线奖励_nextlevel.js
- 每天 0 点的重置也可能被误判为“小退清零”
  OnlineTimeTask 有跨日重置逻辑，且 ExtendValueTask 会清理“每日”类型的扩展值（依据 create_time）。如果小退正好跨过 0 点，会正常清零。
  相关路径：
    - gms-server/src/main/java/org/gms/net/server/task/OnlineTimeTask.java
    - gms-server/src/main/java/org/gms/net/server/task/ExtendValueTask.java
    - gms-server/src/main/java/org/gms/dao/mapper/ExtendValueMapper.java

如果你要我进一步确认“玩家小退的具体路径是否在 5 秒内退出”，我可以下一步给出复现步骤或加临时日志点（不做修复）。

• 这里的“小退”一般指不关客户端、在游戏内快速退出到角色选择或登录界面（有时也包括直接断线重连），而不是完整关闭客户端。

“太快”是指你刚进图/刚上线就立刻小退，比如 5 秒内就退出。因为在线时间是每 5 秒刷新一次，如果在第一次刷新前就退出，记录到数据库的还是 -1，下次上线就会被当成异常值重置成 0。