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

    if (status === 0) {
		let text = OldTitle;
        text += "当前点券：" + cm.getPlayer().getCashShop().getCash(1) + "\r\n";
        text += "当前抵用券：" + cm.getPlayer().getCashShop().getCash(2) + "\r\n";
        text += "当前信用券：" + cm.getPlayer().getCashShop().getCash(4) + "\r\n";
		text += "当前金币：" + cm.getPlayer().getMeso() + "\r\n";
        text += " \r\n\r\n";
		text += "#L3#传送自由#l \t #L69#快速转职#l \t #L70#学习技能#l\r\n";
		text += "#L71#超级传送#l \t #L4#爆率一览#l \t #L2#在线奖励#l\r\n";
        text += "#L0#新人福利#l \t #L1#每日签到#l  \t #L72#转世重生#l\r\n";
		text += "#L999#测试脚本>>>未上线#l \t \r\n";
        if (cm.getPlayer().isGM()) {
            text += "\r\n\r\n";
            text += "\t\t\t\t#r=====以下内容仅GM可见=====\r\n";
            text += "#L61#超级传送#l \t #L62#超级商店#l \t #L63#整容集合#l\r\n\r\n";
			text += "#L64#UI查询#l \t #L65#一键删除道具#l \t #L66#一键刷道具#l\r\n\r\n";
			text += "#L67#有状态脚本示例#l \t #L68#NextLevel脚本示例#l";
        }
    }
}

function doSelect(selection) {
    switch (selection) {
        // 非GM功能
		case 999:
            openNpc("测试脚本");
            break;
        case 69:
            openNpc("快速转职");
            break;
        case 70:
            openNpc("技能学习");
            break;
        case 71:
            openNpc("万能传送");
            break;
        case 72:
            openNpc("转世重生");
            break;
        case 0:
            openNpc("新人福利");
            break;
        case 1:
            openNpc("每日签到");
            break;
        case 2:
            openNpc("在线奖励_nextlevel");
            break;
        case 3:
            cm.getPlayer().saveLocation("FREE_MARKET");
            cm.warp(910000000, "out00");
            break;
        case 4:
            openNpc("当前地图掉落");
            break;
        // GM功能
        case 61:
            openNpc("万能传送");
            break;
        case 62:
            cm.dispose();
            cm.openShopNPC(9900001);
            cm.dispose();
            break;
        case 63:
            openNpc("Salon");
            break;
        case 64:
            openNpc("UI查询");
            break;	
        case 65:
            openNpc("一键删除道具");
            break;
        case 66:
            openNpc("一键刷道具");
            break;
        case 67:
            openNpc("Example1")
            break;
        case 68:
            openNpc("Example2")
            break;


        default:
            cm.sendOk("该功能暂不支持，敬请期待！");
            cm.dispose();
    }
}

function openNpc(scriptName) {
    cm.dispose();
    cm.openNpc(9900001, scriptName);
}