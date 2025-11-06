const { pool } = require('../config/database');

class User {
  /**
   * 创建或更新用户
   */
  static async createOrUpdate(userData) {
    const {
      user_id,
      openid,
      nickname,
      avatar_url,
      source = 'h5',
      device_info
    } = userData;

    const sql = `
      INSERT INTO users (user_id, openid, nickname, avatar_url, source, device_info, total_quota, used_quota, last_login_time)
      VALUES (?, ?, ?, ?, ?, ?, 50, 0, NOW())
      ON DUPLICATE KEY UPDATE
        nickname = VALUES(nickname),
        avatar_url = VALUES(avatar_url),
        device_info = VALUES(device_info),
        last_login_time = NOW()
    `;

    try {
      const [result] = await pool.execute(sql, [
        user_id,
        openid || null,
        nickname || '游客',
        avatar_url || '',
        source,
        device_info ? JSON.stringify(device_info) : null
      ]);
      return { success: true, user_id };
    } catch (error) {
      console.error('创建/更新用户失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  static async getById(user_id) {
    const sql = 'SELECT * FROM users WHERE user_id = ?';
    try {
      const [rows] = await pool.execute(sql, [user_id]);
      return rows[0] || null;
    } catch (error) {
      console.error('获取用户失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户配额
   */
  static async updateQuota(user_id, used_quota) {
    const sql = 'UPDATE users SET used_quota = ? WHERE user_id = ?';
    try {
      await pool.execute(sql, [used_quota, user_id]);
      return { success: true };
    } catch (error) {
      console.error('更新配额失败:', error);
      throw error;
    }
  }

  /**
   * 消费配额
   */
  static async consumeQuota(user_id) {
    const sql = `
      UPDATE users 
      SET used_quota = used_quota + 1 
      WHERE user_id = ? AND used_quota < total_quota
    `;
    try {
      const [result] = await pool.execute(sql, [user_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('消费配额失败:', error);
      throw error;
    }
  }
}

module.exports = User;
