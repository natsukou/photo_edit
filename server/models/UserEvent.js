const { pool } = require('../config/database');

class UserEvent {
  /**
   * 记录用户事件
   */
  static async create(eventData) {
    const {
      user_id,
      session_id,
      event_type,
      event_target,
      event_data,
      page_name
    } = eventData;

    const sql = `
      INSERT INTO user_events 
      (user_id, session_id, event_type, event_target, event_data, page_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(sql, [
        user_id,
        session_id,
        event_type,
        event_target,
        JSON.stringify(event_data),
        page_name
      ]);
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('记录用户事件失败:', error);
      throw error;
    }
  }

  /**
   * 批量记录用户事件
   */
  static async createBatch(events) {
    if (!events || events.length === 0) return { success: true, count: 0 };

    const sql = `
      INSERT INTO user_events 
      (user_id, session_id, event_type, event_target, event_data, page_name)
      VALUES ?
    `;

    const values = events.map(e => [
      e.user_id,
      e.session_id,
      e.event_type,
      e.event_target,
      JSON.stringify(e.event_data),
      e.page_name
    ]);

    try {
      const [result] = await pool.query(sql, [values]);
      return { success: true, count: result.affectedRows };
    } catch (error) {
      console.error('批量记录用户事件失败:', error);
      throw error;
    }
  }
}

module.exports = UserEvent;
