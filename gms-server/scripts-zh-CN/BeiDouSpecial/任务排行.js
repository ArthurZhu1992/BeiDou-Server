var DatabaseConnection = Java.type("org.gms.util.DatabaseConnection");

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode != 1) {
        cm.dispose();
        return;
    }

    // 使用最基础的颜色代码，避免闪退
    var text = "#e#d★ 任务完成量排行榜 (TOP 50) ★#n#k\r\n\r\n";
    var conn = null;
    var ps = null;
    var rs = null;

    try {
        conn = DatabaseConnection.getConnection();
        var sql = "SELECT c.name, COUNT(*) AS cnt " +
            "FROM characters c " +
            "INNER JOIN queststatus q ON c.id = q.characterid " +
            "WHERE q.completed = 1 " +
            "GROUP BY c.id " +
            "ORDER BY cnt DESC " +
            "LIMIT 50";

        ps = conn.prepareStatement(sql);
        rs = ps.executeQuery();

        var i = 0;
        while (rs.next()) {
            i++;
            var name = rs.getString("name");
            var count = rs.getInt("cnt");

            // 阶段颜色逻辑 (使用最稳妥的颜色代码)
            var color = "#b"; // 默认蓝色
            if (i == 1) { color = "#r"; }      // 第1名 红色
            else if (i == 2) { color = "#d"; } // 第2名 紫色
            else if (i == 3) { color = "#g"; } // 第3名 绿色
            else if (i > 10) { color = "#k"; } // 10名以后 黑色

            var rankStr = (i < 10 ? "0" + i : i);

            // 简化拼接逻辑，减少特殊字符
            text += color + "【" + rankStr + "】 #k" + name;
            // 动态补齐空格，防止文本错位
            var spaces = "";
            for (var j = 0; j < (15 - name.length); j++) { spaces += " "; }

            text += spaces + " 完成数: " + color + count + "#k\r\n";
        }

        if (i == 0) {
            text += "暂无排名记录。";
        }

    } catch (e) {
        text = "数据查询失败。";
        java.lang.System.err.println("Ranking Error: " + e);
    } finally {
        try { if (rs != null) rs.close(); } catch (e) {}
        try { if (ps != null) ps.close(); } catch (e) {}
        try { if (conn != null) conn.close(); } catch (e) {} // 必须：归还连接池
    }

    // 发送文本。如果还是闪退，尝试把 LIMIT 50 改成 20，测试是否是长度问题。
    cm.sendOk(text);
    cm.dispose();
}
