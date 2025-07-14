const express = require('express');
const router = express.Router();
const apigw = require('../services/apigw');
const auth = require('../middleware/auth');
const yup = require('yup');

// Middleware xác thực cho tất cả route
// router.use(auth);

// Logging middleware cho route này
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} body=`, req.body);
  next();
});

// ========== NOTIFICATION ==========
const notificationSearchSchema = yup.object({
  pagination: yup.object({
    page_size: yup.number().required(),
    current: yup.number().required(),
  }),
  filters: yup.object(),
});
router.post('/notification/search', async (req, res) => {
  try {
    await notificationSearchSchema.validate(req.body);
    const user_id = req.user.user_id;
    const { pagination, filters } = req.body;
    const result = await apigw.notificationSearch({ user_id, pagination, filters }, req.token || req.headers.authorization?.split(' ')[1]);
    console.log('Response:', result);
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.post('/notification/create', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { title, message, notification_type, severity, object_code, object_id } = req.body;
    const result = await apigw.notificationCreate({ user_id, title, message, notification_type, severity, object_code, object_id });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.patch('/notification/:id/status', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { status } = req.body;
    const { id } = req.params;
    const result = await apigw.notificationMarkRead({ user_id, id, status });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== TRANSACTION ==========
const transactionSearchSchema = yup.object({
  pagination: yup.object({
    page_size: yup.number().required(),
    current: yup.number().required(),
  }),
  filters: yup.object(),
  search_text: yup.string(),
});
router.post('/transaction/search', async (req, res) => {
  try {
    // await transactionSearchSchema.validate(req.body);
    // const user_id = req.user.user_id;
    // const { pagination, filters, search_text } = req.body;
    // const result = await apigw.transactionSearch({ user_id, pagination, filters, search_text });
    const result = await apigw.transactionSearch({});
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.post('/transaction/create', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const data = { ...req.body, user_id };
    const result = await apigw.transactionCreate(data);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.patch('/transaction/:id/classify', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { category_label } = req.body;
    const { id } = req.params;
    const result = await apigw.transactionClassify({ user_id, id, category_label });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== JAR ==========
router.get('/jar/:id', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { year_month } = req.query;
    const { id } = req.params;
    const result = await apigw.jarGet({ user_id, id, year_month });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/jar/initialize', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { income } = req.body;
    const result = await apigw.jarInitialize({ user_id, income });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/jar/percent', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { year_month, jars } = req.body;
    const result = await apigw.jarUpdatePercent({ user_id, year_month, jars });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== GOAL ==========
const goalSearchSchema = yup.object({
  pagination: yup.object({
    page_size: yup.number().required(),
    current: yup.number().required(),
  }),
  filters: yup.object(),
  search_text: yup.string(),
});
router.post('/goal/search', async (req, res) => {
  try {
    await goalSearchSchema.validate(req.body);
    const user_id = req.user.user_id;
    const { pagination, filters, search_text } = req.body;
    const result = await apigw.goalSearch({ user_id, pagination, filters, search_text });
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.post('/goal/create', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const data = { ...req.body, user_id };
    const result = await apigw.goalCreate(data);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/goal/:id', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const data = { ...req.body, user_id, id };
    const result = await apigw.goalUpdate(data);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/goal/:id', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const result = await apigw.goalRemove({ user_id, id });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== AI ==========
router.post('/ai/transaction/classify', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const data = { ...req.body, user_id };
    const result = await apigw.aiTransactionClassify(data);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/ai/jar/coaching', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await apigw.aiJarCoaching({ user_id });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/ai/goal/coaching', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await apigw.aiGoalCoaching({ user_id });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== QNA ==========
router.post('/qna/session', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { history, prompt } = req.body;
    const result = await apigw.qnaSession({ user_id, history, prompt });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== AUTH ==========
router.get('/auth/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await apigw.authGetById({ id });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password, by } = req.body;
    const result = await apigw.authLogin({ username, password, by });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/auth/logout', (req, res) => {
  // Logout handle locally on client, just return success
  res.json({ success: true });
});

module.exports = router; 