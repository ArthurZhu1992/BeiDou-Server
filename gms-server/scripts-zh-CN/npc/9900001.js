/*
    BeiDou Script Center - Clean & Stable v083 Layout (Optimized Style, 3 Columns)
*/

var icon = "#fUI/UIWindow.img/QuestIcon/3/0#"; // 使用稳定的图标路径
var status = -1;

// 辅助函数：格式化数值，防止数字过长导致闪退
function formatValue(value) {
    if (value >= 100000000) return (value / 100000000).toFixed(2) + " 亿";
    if (value >= 10000) return (value / 10000).toFixed(1) + " 万";
    return value.toString();
}

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == 1) status++;
    else {
        if (mode == 0 && status == 0) cm.dispose();
        status--;
    }

    if (status == 0) {
        var p = cm.getPlayer();
        var nx = formatValue(p.getCashShop().getCash(1));
        var dy = formatValue(p.getCashShop().getCash(2));
        var meso = formatValue(p.getMeso());

        var selStr = "\r\n\t\t #e#r" + icon + " BeiDou 脚本中心 " + icon + "#n#k\r\n";
        selStr += "#d━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━#k\r\n";

        // 资产信息区域
        selStr += " #b点券:#k #r" + nx + "#k #b抵用:#k #r" + dy + "#k #b金币:#k #r" + meso + "#k\r\n";

        selStr += "\r\n#d━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━#k\r\n";

        // 主要功能区 (三列布局)
        selStr += "#L0# #b新人福利#k#l #L1# #b每日签到#k#l #L2# #b在线奖励#k#l\r\n";
        selStr += "#L3# #b传送中心#k#l #L4# #b爆率查询#k#l #L5# #b任务排行#k#l\r\n";

        // 70级专属进阶区
        if (p.getLevel() >= 70) {
            selStr += "\r\n#d━━━━━━━━━━━#k#e#r[ 进阶功能区 (Lv.70+) ]#k#n#d━━━━━━━━━━━#k\r\n";
            selStr += "#L6# #r清理背包#k#l\r\n";
        }

        // GM功能区（隐藏）
        if (p.isGM()) {
            selStr += "\r\n#d━━━━━━━━━━━━━━━━━#k#e#r[ GM 后台 ]#k#n#d━━━━━━━━━━━━━━━━━#k\r\n";
            selStr += "#L61#超级传送#l #L62#超级商店#l #L63#整容集合#l\r\n";
        }

        cm.sendSimple(selStr);

    } else if (status == 1) {
        switch (selection) {
            case 0: cm.dispose(); cm.openNpc(9900001, "新人福利"); break;
            case 1: cm.dispose(); cm.openNpc(9900001, "每日签到"); break;
            case 2: cm.dispose(); cm.openNpc(9900001, "在线奖励_nextlevel"); break;
            case 3:
                cm.dispose();
                cm.getPlayer().saveLocation("FREE_MARKET");
                cm.warp(910000000, "out00");
                break;
            case 4: cm.dispose(); cm.openNpc(9900001, "当前地图掉落"); break;
            case 5: cm.dispose(); cm.openNpc(9900001, "任务排行"); break;
            case 6: cm.dispose(); cm.openNpc(9900001, "一键删除道具small"); break;
            case 61: cm.dispose(); cm.openNpc(9900001, "万能传送"); break;
            case 62: cm.dispose(); cm.openShopNPC(9900001); break;
            case 63: cm.dispose(); cm.openNpc(9900001, "Salon"); break;
            default: cm.dispose();
        }
    }
}
