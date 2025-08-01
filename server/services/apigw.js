const axios = require('axios');
const API_GATEWAY_BASE = process.env.API_GATEWAY_BASE || '';

function getAuthHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ========== NOTIFICATION ==========
exports.notificationSearch = (data, token) => axios.post(`${API_GATEWAY_BASE}/notification/search`, data, { headers: getAuthHeader(token) }).then(r => r.data);
exports.notificationCreate = (data, token) => axios.post(`${API_GATEWAY_BASE}/notification/create`, data, { headers: getAuthHeader(token) }).then(r => r.data);
exports.notificationMarkRead = (data, token) => axios.patch(`${API_GATEWAY_BASE}/notification/${data.id}/status`, data, { headers: getAuthHeader(token) }).then(r => r.data);

// ========== TRANSACTION ==========
exports.transactionSearch = (data, token) => axios.post(`${API_GATEWAY_BASE}/transaction/search`, data, { headers: getAuthHeader(token) }).then(r => r.data);
exports.transactionCreate = (data, token) => axios.post(`${API_GATEWAY_BASE}/transaction/create`, data, { headers: getAuthHeader(token) }).then(r => r.data);
exports.transactionClassify = (data, token) => axios.patch(`${API_GATEWAY_BASE}/transaction/${data.id}/classify`, data, { headers: getAuthHeader(token) }).then(r => r.data);

// ========== JAR ==========
exports.jarGet = (data, token) => axios.get(`${API_GATEWAY_BASE}/jar/${data.user_id}${data.year_month ? `?year_month=${data.year_month}` : ''}`, { params: { user_id: data.user_id }, headers: getAuthHeader(token) }).then(r => r.data);
exports.jarInitialize = (data, token) => axios.post(`${API_GATEWAY_BASE}/jar/initialize`, data, { headers: getAuthHeader(token) }).then(r => r.data);
exports.jarUpdatePercent = (data, token) => axios.put(`${API_GATEWAY_BASE}/jar/percent`, data, { headers: getAuthHeader(token) }).then(r => r.data);

// ========== GOAL ==========
// POST /goal/search
exports.goalSearch = (data, token) =>
    axios.post(`${API_GATEWAY_BASE}/goal/search`, data, {
      headers: getAuthHeader(token)
    }).then(res => res.data);
// POST /goal/set
exports.goalCreateBatch = (data, token) =>
    axios.post(`${API_GATEWAY_BASE}/goal/set`, data, {
      headers: getAuthHeader(token)
    }).then(res => res.data);
// POST /goal/allocate
exports.goalAllocate = (data, token) =>
    axios.post(`${API_GATEWAY_BASE}/goal/allocate`, data, {
      headers: getAuthHeader(token)
    }).then(res => res.data);
// POST /goal/pause/:goal_id
exports.goalPause = (data, token) =>
    axios.post(`${API_GATEWAY_BASE}/goal/pause/${data.goal_id}`, data, {
      headers: getAuthHeader(token)
    }).then(res => res.data);
// DELETE /goal/:goal_id
exports.goalRemove = (data, token) =>
    axios.delete(`${API_GATEWAY_BASE}/goal/delete/${data.goal_id}`, {
      data,
      headers: getAuthHeader(token)
    }).then(res => res.data);

// ========== AI ==========
exports.aiJarCoaching = (data, token) => axios.post(`${API_GATEWAY_BASE}/ai/jar/coaching`, data, { headers: getAuthHeader(token) }).then(r => r.data);
exports.aiGoalCoaching = (data, token) => axios.post(`${API_GATEWAY_BASE}/ai/goal/coaching`, data, { headers: getAuthHeader(token) }).then(r => r.data);

// ========== QNA ==========
exports.qnaSession = (data, token) => axios.post(`${API_GATEWAY_BASE}/ai/qna/session`, data, { headers: getAuthHeader(token) }).then(r => r.data);

// ========== AUTH ==========
exports.authGetById = (data, token) => axios.get(`${API_GATEWAY_BASE}/auth/${data.id}`, { headers: getAuthHeader(token) }).then(r => r.data);
exports.authLogin = (data, token) => axios.post(`${API_GATEWAY_BASE}/auth/login`, data, { headers: getAuthHeader(token) }).then(r => r.data); 