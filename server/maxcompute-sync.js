// MaxCompute数据同步工具
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

// MaxCompute连接配置（使用ODPS SDK）
// 注意：在生产环境中，您需要安装aliyun-odps-sdk-nodejs包
// npm install aliyun-odps-sdk-nodejs

class MaxComputeSync {
  constructor() {
    // MySQL配置
    this.mysqlConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'photo_assistant',
      charset: 'utf8mb4'
    };

    // MaxCompute/ODPS配置
    this.odpsConfig = {
      accessKeyId: process.env.MAXCOMPUTE_ACCESS_KEY_ID,
      accessKeySecret: process.env.MAXCOMPUTE_ACCESS_KEY_SECRET,
      project: process.env.MAXCOMPUTE_PROJECT,
      endpoint: process.env.MAXCOMPUTE_ENDPOINT || 'http://service.odps.aliyun.com/api'
    };

    this.mysqlPool = null;
  }

  // 初始化连接
  async initialize() {
    try {
      this.mysqlPool = mysql.createPool(this.mysqlConfig);
      console.log('✅ MySQL连接池创建成功');

      // 验证MySQL连接
      const connection = await this.mysqlPool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      console.log('✅ MySQL连接测试成功');

      // 验证MaxCompute配置
      if (!this.odpsConfig.accessKeyId || !this.odpsConfig.accessKeySecret || !this.odpsConfig.project) {
        console.warn('⚠️ MaxCompute配置不完整，将使用模拟模式');
        this.simulationMode = true;
      } else {
        console.log('✅ MaxCompute配置验证成功');
        this.simulationMode = false;
      }
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      throw error;
    }
  }

  // 同步页面访问数据到MaxCompute
  async syncPageViews(startDate = null, endDate = null) {
    console.log('🔄 开始同步页面访问数据到MaxCompute...');
    
    const query = `
      SELECT 
        id, user_id, session_id, page_name, previous_page, duration,
        device_type, browser, os, screen_resolution, referrer, created_time
      FROM page_views 
      WHERE 1=1
      ${startDate ? `AND created_time >= '${startDate}'` : ''}
      ${endDate ? `AND created_time <= '${endDate}'` : ''}
      ORDER BY created_time DESC
      LIMIT 10000
    `;

    try {
      const [rows] = await this.mysqlPool.execute(query);
      console.log(`📊 查询到 ${rows.length} 条页面访问记录`);

      if (this.simulationMode) {
        console.log('🧪 模拟模式：将数据导出到CSV文件');
        await this.exportToCSV(rows, 'page_views');
      } else {
        // 实际同步到MaxCompute
        await this.uploadToMaxCompute(rows, 'page_views');
      }

      console.log('✅ 页面访问数据同步完成');
      return { success: true, count: rows.length };
    } catch (error) {
      console.error('❌ 同步页面访问数据失败:', error);
      throw error;
    }
  }

  // 同步用户事件数据到MaxCompute
  async syncUserEvents(startDate = null, endDate = null) {
    console.log('🔄 开始同步用户事件数据到MaxCompute...');
    
    const query = `
      SELECT 
        id, user_id, session_id, event_type, event_target, event_data, page_name, created_time
      FROM user_events 
      WHERE 1=1
      ${startDate ? `AND created_time >= '${startDate}'` : ''}
      ${endDate ? `AND created_time <= '${endDate}'` : ''}
      ORDER BY created_time DESC
      LIMIT 10000
    `;

    try {
      const [rows] = await this.mysqlPool.execute(query);
      console.log(`📊 查询到 ${rows.length} 条用户事件记录`);

      if (this.simulationMode) {
        console.log('🧪 模拟模式：将数据导出到CSV文件');
        await this.exportToCSV(rows, 'user_events');
      } else {
        // 实际同步到MaxCompute
        await this.uploadToMaxCompute(rows, 'user_events');
      }

      console.log('✅ 用户事件数据同步完成');
      return { success: true, count: rows.length };
    } catch (error) {
      console.error('❌ 同步用户事件数据失败:', error);
      throw error;
    }
  }

  // 同步照片记录数据到MaxCompute
  async syncPhotoRecords(startDate = null, endDate = null) {
    console.log('🔄 开始同步照片记录数据到MaxCompute...');
    
    const query = `
      SELECT 
        id, user_id, photo_url, photo_size, photo_width, photo_height, 
        category, style, custom_description, created_time
      FROM photo_records 
      WHERE 1=1
      ${startDate ? `AND created_time >= '${startDate}'` : ''}
      ${endDate ? `AND created_time <= '${endDate}'` : ''}
      ORDER BY created_time DESC
      LIMIT 10000
    `;

    try {
      const [rows] = await this.mysqlPool.execute(query);
      console.log(`📊 查询到 ${rows.length} 条照片记录`);

      if (this.simulationMode) {
        console.log('🧪 模拟模式：将数据导出到CSV文件');
        await this.exportToCSV(rows, 'photo_records');
      } else {
        // 实际同步到MaxCompute
        await this.uploadToMaxCompute(rows, 'photo_records');
      }

      console.log('✅ 照片记录数据同步完成');
      return { success: true, count: rows.length };
    } catch (error) {
      console.error('❌ 同步照片记录数据失败:', error);
      throw error;
    }
  }

  // 导出数据到CSV（模拟模式）
  async exportToCSV(data, tableName) {
    const fs = require('fs');
    const csv = require('csv-writer').createArrayCsvWriter;
    
    // 创建临时目录
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `${tableName}_${Date.now()}.csv`;
    const filePath = path.join(tempDir, fileName);

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvWriter = csv({
        path: filePath,
        header: headers
      });

      const records = data.map(row => headers.map(header => row[header]));
      await csvWriter.writeRecords(records);
      
      console.log(`📁 数据已导出到: ${filePath}`);
    } else {
      console.log(`📁 无数据需要导出`);
    }
  }

  // 上传数据到MaxCompute（这里使用模拟实现）
  async uploadToMaxCompute(data, tableName) {
    console.log(`📤 正在上传 ${data.length} 条记录到MaxCompute表: ${tableName}`);
    
    // 在实际实现中，这里应该使用阿里云ODPS SDK
    // 由于需要额外的依赖包，这里提供伪代码示例
    
    if (data.length === 0) {
      console.log('📭 无数据需要上传');
      return;
    }

    // 这里应该是真实的MaxCompute上传逻辑
    // const odps = new ODPS({
    //   accessKeyId: this.odpsConfig.accessKeyId,
    //   accessKeySecret: this.odpsConfig.accessKeySecret,
    //   project: this.odpsConfig.project,
    //   endpoint: this.odpsConfig.endpoint
    // });
    //
    // const table = odps.getTable(tableName);
    // await table.openBufferStream().then(stream => {
    //   // 写入数据
    //   stream.end();
    // });

    console.log(`✅ ${tableName} 表数据上传完成（模拟）`);
  }

  // 执行定时同步任务
  async scheduleSync(syncConfig = {}) {
    console.log('🕐 开始执行定时数据同步任务...');
    
    const {
      syncPageViews: syncPV = true,
      syncUserEvents: syncUE = true,
      syncPhotoRecords: syncPR = true,
      startDate = null,
      endDate = null
    } = syncConfig;

    const results = {};

    try {
      if (syncPV) {
        results.pageViews = await this.syncPageViews(startDate, endDate);
      }
      
      if (syncUE) {
        results.userEvents = await this.syncUserEvents(startDate, endDate);
      }
      
      if (syncPR) {
        results.photoRecords = await this.syncPhotoRecords(startDate, endDate);
      }

      console.log('✅ 定时同步任务完成:', results);
      return results;
    } catch (error) {
      console.error('❌ 定时同步任务失败:', error);
      throw error;
    }
  }

  // 获取同步统计信息
  async getSyncStats() {
    try {
      const [pvCount] = await this.mysqlPool.execute(
        'SELECT COUNT(*) as count FROM page_views WHERE created_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
      );
      
      const [ueCount] = await this.mysqlPool.execute(
        'SELECT COUNT(*) as count FROM user_events WHERE created_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
      );
      
      const [prCount] = await this.mysqlPool.execute(
        'SELECT COUNT(*) as count FROM photo_records WHERE created_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
      );

      return {
        pageViewsLast24h: pvCount[0].count,
        userEventsLast24h: ueCount[0].count,
        photoRecordsLast24h: prCount[0].count,
        lastSyncTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ 获取同步统计信息失败:', error);
      throw error;
    }
  }

  // 关闭连接
  async close() {
    if (this.mysqlPool) {
      await this.mysqlPool.end();
      console.log('🔌 MySQL连接池已关闭');
    }
  }
}

module.exports = MaxComputeSync;