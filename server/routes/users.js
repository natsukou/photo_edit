const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/users/login
 * 用户登录/注册
 */
router.post('/login', async (req, res) => {
  try {
    const { openid, nickname, avatar_url, source, device_info } = req.body;

    // 生成或使用user_id
    let user_id = req.body.user_id;
    if (!user_id) {
      user_id = `user_${uuidv4()}`;
    }

    // 创建或更新用户
    await User.createOrUpdate({
      user_id,
      openid,
      nickname,
      avatar_url,
      source,
      device_info
    });

    // 获取用户完整信息
    const user = await User.getById(user_id);

    res.json({
      code: 0,
      message: 'success',
      data: {
        user_id: user.user_id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        total_quota: user.total_quota,
        used_quota: user.used_quota,
        remaining_quota: user.total_quota - user.used_quota
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * GET /api/users/:user_id
 * 获取用户信息
 */
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.getById(user_id);

    if (!user) {
      return res.status(404).json({
        code: -1,
        message: '用户不存在'
      });
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        user_id: user.user_id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        total_quota: user.total_quota,
        used_quota: user.used_quota,
        remaining_quota: user.total_quota - user.used_quota
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * POST /api/users/:user_id/consume-quota
 * 消费配额
 */
router.post('/:user_id/consume-quota', async (req, res) => {
  try {
    const { user_id } = req.params;
    const success = await User.consumeQuota(user_id);

    if (!success) {
      return res.status(400).json({
        code: -1,
        message: '配额不足'
      });
    }

    // 获取更新后的用户信息
    const user = await User.getById(user_id);

    res.json({
      code: 0,
      message: 'success',
      data: {
        used_quota: user.used_quota,
        remaining_quota: user.total_quota - user.used_quota
      }
    });
  } catch (error) {
    console.error('消费配额失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * POST /api/users/:user_id/reset-quota
 * 重置每日配额
 */
router.post('/:user_id/reset-quota', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // 重置配额为0
    const sql = 'UPDATE users SET used_quota = 0 WHERE user_id = ?';
    await require('../config/database').pool.execute(sql, [user_id]);
    
    // 获取更新后的用户信息
    const user = await User.getById(user_id);

    res.json({
      code: 0,
      message: 'success',
      data: {
        used_quota: user.used_quota,
        remaining_quota: user.total_quota - user.used_quota
      }
    });
  } catch (error) {
    console.error('重置配额失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
