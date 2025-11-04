const Dashboard = require('../models/dashboardModel');
const { Activities } = require('../models/activitiesModel');

exports.superadminDashboard = async (req, res) => {
  try {
    const results = await Dashboard.superadminDashboard();
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching Dashboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.activityCounts = async (req, res) => {
  try {
    const counts = await Activities.counts();
    return res.status(200).json({ status: 'success', data: counts });
  } catch (err) {
    console.error('Error fetching activity counts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.notTakenParticipants = async (req, res) => {
  try {
    const { activity, limit = 10, page = 1 } = req.query;
    if (!activity) {
      return res.status(400).json({ error: 'activity is required' });
    }
    const result = await Activities.listNotTaken({ activity, limit: Number(limit), page: Number(page) });
    return res.status(200).json({ status: 'success', ...result, page: Number(page), limit: Number(limit) });
  } catch (err) {
    const code = err && err.status ? err.status : 500;
    if (code === 400) {
      return res.status(400).json({ error: 'Invalid activity' });
    }
    console.error('Error fetching not-taken participants:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};