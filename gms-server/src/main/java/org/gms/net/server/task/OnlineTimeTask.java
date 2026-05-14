package org.gms.net.server.task;

import org.gms.client.Character;
import org.gms.net.server.Server;
import org.gms.net.server.channel.Channel;

// 在线时长定时任务
// 每5秒遍历全服所有在线角色, 调用 tickOnlineTime() 递增在线时长
// 该任务只做"转发", 跨日归零和上限钳制由 Character 内部处理
public class OnlineTimeTask implements Runnable {
    @Override
    public void run() {
        if (!Server.getInstance().isOnline()) return;
        for (Channel chan : Server.getInstance().getAllChannels()) {
            if (chan == null || chan.getPlayerStorage() == null) continue;
            for (Character chr : chan.getPlayerStorage().getAllCharacters()) {
                if (chr == null) continue;
                chr.tickOnlineTime();
            }
        }
    }
}
