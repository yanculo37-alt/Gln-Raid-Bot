// Tracks in-flight cancellable jobs per user so /cancel can stop them.
const activeJobs = new Map(); // userId -> Set<token>

function createToken(userId) {
  const token = { cancelled: false, userId, startedAt: Date.now() };
  if (!activeJobs.has(userId)) activeJobs.set(userId, new Set());
  activeJobs.get(userId).add(token);
  return token;
}

function releaseToken(token) {
  if (!token) return;
  const set = activeJobs.get(token.userId);
  if (!set) return;
  set.delete(token);
  if (set.size === 0) activeJobs.delete(token.userId);
}

function cancelAllForUser(userId) {
  const set = activeJobs.get(userId);
  if (!set || set.size === 0) return 0;
  let count = 0;
  for (const t of set) { t.cancelled = true; count++; }
  return count;
}

function activeCountForUser(userId) {
  return activeJobs.get(userId)?.size || 0;
}

module.exports = { createToken, releaseToken, cancelAllForUser, activeCountForUser };
