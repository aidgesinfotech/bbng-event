const db = require('../config/db');

const VALID_ACTIVITIES = ['welcome_kit', 'breakfast', 'lunch', 'high_tea'];

const Activities = {
  getByParticipantId: async (participant_id) => {
    const [rows] = await db.execute(`SELECT * FROM activities WHERE participant_id = ?`, [participant_id]);
    return rows[0] || null;
  },
  markActivity: async ({ participant_id, activity }) => {
    if (!VALID_ACTIVITIES.includes(activity)) {
      const err = new Error('Invalid activity');
      err.status = 400;
      throw err;
    }

    // ensure row exists
    const [existing] = await db.execute(`SELECT * FROM activities WHERE participant_id = ? FOR UPDATE`, [participant_id]);
    if (existing.length === 0) {
      await db.execute(`INSERT INTO activities (participant_id, welcome_kit, breakfast, lunch, high_tea, timestamps) VALUES (?, 0, 0, 0, 0, JSON_OBJECT())`, [participant_id]);
    }

    // check already taken
    const [rows] = await db.execute(`SELECT welcome_kit, breakfast, lunch, high_tea, timestamps FROM activities WHERE participant_id = ?`, [participant_id]);
    const row = rows[0];
    if (row && row[activity] === 1) {
      const err = new Error('Already Taken');
      err.status = 409;
      throw err;
    }

    // update flag and timestamp json
    const nowIso = new Date().toISOString();
    // Use JSON_SET; initialize timestamps if null
    await db.execute(
      `UPDATE activities 
       SET ${activity} = 1,
           timestamps = IFNULL(timestamps, JSON_OBJECT()),
           timestamps = JSON_SET(timestamps, ?, ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE participant_id = ?`,
      [
        `$.${activity}`,
        nowIso,
        participant_id
      ]
    );

    const [after] = await db.execute(`SELECT * FROM activities WHERE participant_id = ?`, [participant_id]);
    return after[0];
  },
  counts: async () => {
    const [rows] = await db.execute(
      `SELECT 
        SUM(welcome_kit) AS total_welcome_kit,
        SUM(breakfast) AS total_breakfast,
        SUM(lunch) AS total_lunch,
        SUM(high_tea) AS total_high_tea
      FROM activities`
    );
    return rows[0] || { total_welcome_kit: 0, total_breakfast: 0, total_lunch: 0, total_high_tea: 0 };
  },
  listNotTaken: async ({ activity, limit = 10, page = 1 }) => {
    if (!VALID_ACTIVITIES.includes(activity)) {
      const err = new Error('Invalid activity');
      err.status = 400;
      throw err;
    }
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT p.* FROM participants p 
       LEFT JOIN activities a ON a.participant_id = p.id
       WHERE IFNULL(a.${activity}, 0) = 0
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    const [count] = await db.execute(
      `SELECT COUNT(*) AS total FROM participants p 
       LEFT JOIN activities a ON a.participant_id = p.id
       WHERE IFNULL(a.${activity}, 0) = 0`
    );
    return { data: rows, total: count[0].total };
  }
};

module.exports = { Activities, VALID_ACTIVITIES };
