const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

/**
 * POST /api/feedback
 * 创建反馈
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      photo_id,
      feedback_type,
      rating,
      content,
      contact
    } = req.body;

    const result = await Feedback.create({
      user_id,
      photo_id,
      feedback_type,
      rating,
      content,
      contact
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        feedback_id: result.feedback_id
      }
    });
  } catch (error) {
    console.error('创建反馈失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * GET /api/feedback/pending
 * 获取待处理反馈
 */
router.get('/pending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const feedbacks = await Feedback.getPending(limit);

    res.json({
      code: 0,
      message: 'success',
      data: feedbacks
    });
  } catch (error) {
    console.error('获取反馈失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * PUT /api/feedback/:feedback_id
 * 更新反馈状态
 */
router.put('/:feedback_id', async (req, res) => {
  try {
    const { feedback_id } = req.params;
    const { status, handler, handle_note } = req.body;

    await Feedback.updateStatus(
      parseInt(feedback_id),
      status,
      handler,
      handle_note
    );

    res.json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('更新反馈状态失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
