const express = require('express');
const router = express.Router();
const PageView = require('../models/PageView');
const UserEvent = require('../models/UserEvent');

/**
 * POST /api/analytics/page-view
 * 记录页面访问
 */
router.post('/page-view', async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      page_name,
      previous_page,
      duration,
      device_type,
      browser,
      os,
      screen_resolution,
      referrer
    } = req.body;

    const result = await PageView.create({
      user_id,
      session_id,
      page_name,
      previous_page,
      duration,
      device_type,
      browser,
      os,
      screen_resolution,
      referrer
    });

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('记录页面访问失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/page-views-batch
 * 批量记录页面访问
 */
router.post('/page-views-batch', async (req, res) => {
  try {
    const { page_views } = req.body;

    if (!Array.isArray(page_views)) {
      return res.status(400).json({
        code: -1,
        message: 'page_views必须是数组'
      });
    }

    const result = await PageView.createBatch(page_views);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('批量记录页面访问失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/event
 * 记录用户事件
 */
router.post('/event', async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      event_type,
      event_target,
      event_data,
      page_name
    } = req.body;

    const result = await UserEvent.create({
      user_id,
      session_id,
      event_type,
      event_target,
      event_data,
      page_name
    });

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('记录用户事件失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/events-batch
 * 批量记录用户事件
 */
router.post('/events-batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({
        code: -1,
        message: 'events必须是数组'
      });
    }

    const result = await UserEvent.createBatch(events);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('批量记录用户事件失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/dau
 * 获取今日DAU
 */
router.get('/dau', async (req, res) => {
  try {
    const dau = await PageView.getTodayDAU();

    res.json({
      code: 0,
      message: 'success',
      data: { dau }
    });
  } catch (error) {
    console.error('获取DAU失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
