const { pool } = require('../config/database');

class Feedback {
  /**
   * 创建反馈
   */
  static async create(feedbackData) {
    const {
      user_id,
      photo_id,
      feedback_type,
      rating,
      content,
      contact
    } = feedbackData;

    const sql = `
      INSERT INTO feedback 
      (user_id, photo_id, feedback_type, rating, content, contact)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(sql, [
        user_id,
        photo_id,
        feedback_type,
        rating,
        content,
        contact
      ]);
      return { success: true, feedback_id: result.insertId };
    } catch (error) {
      console.error('创建反馈失败:', error);
      throw error;
    }
  }

  /**
   * 获取未处理的反馈
   */
  static async getPending(limit = 50) {
    const sql = `
      SELECT * FROM feedback 
      WHERE status = 'pending' 
      ORDER BY created_time DESC 
      LIMIT ?
    `;
    try {
      const [rows] = await pool.execute(sql, [limit]);
      return rows;
    } catch (error) {
      console.error('获取反馈失败:', error);
      throw error;
    }
  }

  /**
   * 更新反馈状态
   */
  static async updateStatus(feedback_id, status, handler, handle_note) {
    const sql = `
      UPDATE feedback 
      SET status = ?, handler = ?, handle_note = ? 
      WHERE id = ?
    `;
    try {
      await pool.execute(sql, [status, handler, handle_note, feedback_id]);
      return { success: true };
    } catch (error) {
      console.error('更新反馈状态失败:', error);
      throw error;
    }
  }
}

module.exports = Feedback;
