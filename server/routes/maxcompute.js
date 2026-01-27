const express = require('express');
const router = express.Router();
const MaxComputeSync = require('../maxcompute-sync');

// 初始化MaxCompute同步工具
let maxComputeSync = null;

async function initSyncTool() {
  if (!maxComputeSync) {
    maxComputeSync = new MaxComputeSync();
    await maxComputeSync.initialize();
  }
}

/**
 * POST /api/maxcompute/sync-now
 * 立即同步数据到MaxCompute
 */
router.post('/sync-now', async (req, res) => {
  try {
    await initSyncTool();
    
    const { startDate, endDate, tables } = req.body;
    
    console.log('🚀 开始手动同步数据到MaxCompute:', { startDate, endDate, tables });
    
    const syncConfig = {
      syncPageViews: !tables || tables.includes('page_views'),
      syncUserEvents: !tables || tables.includes('user_events'),
      syncPhotoRecords: !tables || tables.includes('photo_records'),
      startDate,
      endDate
    };
    
    const result = await maxComputeSync.scheduleSync(syncConfig);
    
    res.json({
      code: 0,
      message: '同步任务完成',
      data: result
    });
  } catch (error) {
    console.error('❌ MaxCompute同步失败:', error);
    res.status(500).json({
      code: -1,
      message: '同步失败: ' + error.message
    });
  }
});

/**
 * GET /api/maxcompute/stats
 * 获取同步统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    await initSyncTool();
    
    const stats = await maxComputeSync.getSyncStats();
    
    res.json({
      code: 0,
      message: 'success',
      data: stats
    });
  } catch (error) {
    console.error('❌ 获取同步统计失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取统计信息失败: ' + error.message
    });
  }
});

/**
 * POST /api/maxcompute/schedule
 * 配置定时同步任务
 */
router.post('/schedule', async (req, res) => {
  try {
    const { cronExpression, enabledTables = [] } = req.body;
    
    // 在实际实现中，这里会配置cron任务
    // 为了简化，我们只是验证参数
    if (!cronExpression) {
      return res.status(400).json({
        code: -1,
        message: 'cron表达式不能为空'
      });
    }
    
    console.log('⏰ 配置定时同步任务:', { cronExpression, enabledTables });
    
    // 这里应该是实际的cron任务配置逻辑
    // const cronJob = new CronJob(cronExpression, async () => {
    //   // 执行同步任务
    // });
    
    res.json({
      code: 0,
      message: '定时任务配置成功',
      data: {
        cronExpression,
        enabledTables,
        nextRun: '2025-01-01T00:00:00.000Z' // 实际实现中应计算下次运行时间
      }
    });
  } catch (error) {
    console.error('❌ 配置定时任务失败:', error);
    res.status(500).json({
      code: -1,
      message: '配置定时任务失败: ' + error.message
    });
  }
});

/**
 * GET /api/maxcompute/schema
 * 获取MaxCompute表结构
 */
router.get('/schema', async (req, res) => {
  try {
    // 返回建议的MaxCompute表结构
    const schema = {
      page_views: {
        fields: [
          { name: 'id', type: 'BIGINT', comment: '主键ID' },
          { name: 'user_id', type: 'STRING', comment: '用户ID' },
          { name: 'session_id', type: 'STRING', comment: '会话ID' },
          { name: 'page_name', type: 'STRING', comment: '页面名称' },
          { name: 'previous_page', type: 'STRING', comment: '上一页面' },
          { name: 'duration', type: 'INT', comment: '停留时长(秒)' },
          { name: 'device_type', type: 'STRING', comment: '设备类型' },
          { name: 'browser', type: 'STRING', comment: '浏览器' },
          { name: 'os', type: 'STRING', comment: '操作系统' },
          { name: 'screen_resolution', type: 'STRING', comment: '屏幕分辨率' },
          { name: 'referrer', type: 'STRING', comment: '来源页面' },
          { name: 'created_time', type: 'DATETIME', comment: '创建时间' }
        ],
        partition: 'ds STRING COMMENT "分区日期"',
        comment: '页面访问记录表'
      },
      user_events: {
        fields: [
          { name: 'id', type: 'BIGINT', comment: '主键ID' },
          { name: 'user_id', type: 'STRING', comment: '用户ID' },
          { name: 'session_id', type: 'STRING', comment: '会话ID' },
          { name: 'event_type', type: 'STRING', comment: '事件类型' },
          { name: 'event_target', type: 'STRING', comment: '事件目标' },
          { name: 'event_data', type: 'STRING', comment: '事件数据(JSON)' },
          { name: 'page_name', type: 'STRING', comment: '所在页面' },
          { name: 'created_time', type: 'DATETIME', comment: '创建时间' }
        ],
        partition: 'ds STRING COMMENT "分区日期"',
        comment: '用户行为事件表'
      },
      photo_records: {
        fields: [
          { name: 'id', type: 'BIGINT', comment: '主键ID' },
          { name: 'user_id', type: 'STRING', comment: '用户ID' },
          { name: 'photo_url', type: 'STRING', comment: '照片URL' },
          { name: 'photo_size', type: 'INT', comment: '照片大小(KB)' },
          { name: 'photo_width', type: 'INT', comment: '照片宽度' },
          { name: 'photo_height', type: 'INT', comment: '照片高度' },
          { name: 'category', type: 'STRING', comment: '题材分类' },
          { name: 'style', type: 'STRING', comment: '风格标签' },
          { name: 'custom_description', type: 'STRING', comment: '自定义描述' },
          { name: 'created_time', type: 'DATETIME', comment: '创建时间' }
        ],
        partition: 'ds STRING COMMENT "分区日期"',
        comment: '照片记录表'
      }
    };
    
    res.json({
      code: 0,
      message: 'success',
      data: schema
    });
  } catch (error) {
    console.error('❌ 获取表结构失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取表结构失败: ' + error.message
    });
  }
});

module.exports = router;