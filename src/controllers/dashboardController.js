import {
  getDashboardSummaryForUser,
  getMyTasksForUser,
  getOverdueTasksForUser,
  getRecentActivityForUser,
} from "../services/dashboardService.js";

export async function getDashboardSummary(req, res) {
  const summary = await getDashboardSummaryForUser(req.dbUserId);
  res.json(summary);
}

export async function getMyTasks(req, res) {
  const tasks = await getMyTasksForUser(req.dbUserId);
  res.json(tasks);
}

export async function getOverdueTasks(req, res) {
  const tasks = await getOverdueTasksForUser(req.dbUserId);
  res.json(tasks);
}

export async function getRecentActivity(req, res) {
  const activity = await getRecentActivityForUser(req.dbUserId);
  res.json(activity);
}

/**
 * Combined endpoint — returns all dashboard data in a single round-trip.
 * Frontend can call /api/dashboard/all instead of 4 separate requests.
 */
export async function getDashboardAll(req, res) {
  const [summary, myTasks, activity] = await Promise.all([
    getDashboardSummaryForUser(req.dbUserId),
    getMyTasksForUser(req.dbUserId),
    getRecentActivityForUser(req.dbUserId),
  ]);
  res.json({ summary, myTasks, activity });
}
