const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  console.log('开始初始化数据库...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../../database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('执行SQL脚本...');
    await connection.query(sql);
    
    console.log('\n✅ 数据库初始化成功！');
    console.log('数据库名称: photo_assistant');
    console.log('已创建表:');
    console.log('  - users (用户表)');
    console.log('  - photo_records (照片记录表)');
    console.log('  - guide_usage (辅助线使用记录表)');
    console.log('  - advice_views (建议查看记录表)');
    console.log('  - page_views (页面访问记录表)');
    console.log('  - user_events (用户行为事件表)');
    console.log('  - feedback (反馈表)');
    console.log('\n已创建视图:');
    console.log('  - v_user_overview (用户概览视图)');
    console.log('  - v_category_style_popularity (题材风格热度视图)');
    console.log('  - v_guide_stats (辅助线使用统计视图)');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 执行初始化
initDatabase()
  .then(() => {
    console.log('\n数据库准备就绪，可以启动服务器了！');
    console.log('运行命令: npm start');
    process.exit(0);
  })
  .catch((error) => {
    console.error('初始化失败:', error);
    process.exit(1);
  });
