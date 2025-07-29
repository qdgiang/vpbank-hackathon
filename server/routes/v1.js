const express = require('express');
const router = express.Router();
const apigw = require('../services/apigw');
const auth = require('../middleware/auth');
const yup = require('yup');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret'; // Đặt biến môi trường cho production


// Logging middleware cho route này
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} body=`, req.body);
  next();
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
    // Dùng user mặc định như yêu cầu
    const { email, password } = req.body || {};
    let user = null
    if (email === 'vpbank@gmail.com' && password === '1234') {
      user = {
        user_id: "000b1dd0-c880-45fd-8515-48dd705a3aa2",
        email: "justin42@example.org",
        hash_pwd: null,
        phone: "001-585-307-9419",
        identity_number: null,
        full_name: "Võ Ngọc Huyền",
        gender: null,
        date_of_birth: "1993-05-24",
        status: 0,
        timezone: "Asia/Ho_Chi_Minh",
        city: "TP HCM",
        created_at: "2020-11-04 07:44:59",
        updated_at: "2021-06-02 07:44:59",
        is_active: 1
      };
    } else if (email === 'smartjarvis@gmail.com' && password === '1234') {
      user = {
        "user_id": "000f71d5-45ef-4cb3-9b3c-45d296c13dd1",
        "email": "stonevalerie@example.org",
        "hash_pwd": null,
        "phone": "6054320648",
        "identity_number": null,
        "full_name": "Bu00f9i u0110u1ee9c Phu00fac",
        "gender": null,
        "date_of_birth": "1994-04-24",
        "status": 0,
        "timezone": "Asia/Ho_Chi_Minh",
        "city": "Huu1ebf",
        "created_at": "2023-06-14 00:33:00",
        "updated_at": "2023-10-23 00:33:00",
        "is_active": 1
      }
    } else if (email === 'zerobugs@gmail.com' && password === '1234') {
      user = {
        "user_id": "001c1be3-35a2-45df-a959-813c46f58a45",
        "email": "timothy14@example.net",
        "hash_pwd": null,
        "phone": "(930)744-8973",
        "identity_number": null,
        "full_name": "Nguyu1ec5n Hu1eefu Vu00e2n",
        "gender": null,
        "date_of_birth": "1965-11-26",
        "status": 0,
        "timezone": "Asia/Ho_Chi_Minh",
        "city": "TP HCM",
        "created_at": "2024-03-12 16:27:22",
        "updated_at": "2024-11-30 16:27:22",
        "is_active": 1
      }
    } else {
      res.status(400).json({ error: 'Incorrect email or password' });
    }
    // Tạo token
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/auth/logout', (req, res) => {
  // Logout handle locally on client, just return success
  res.json({ success: true });
});
// Middleware xác thực cho tất cả route
router.use(auth);

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
router.post('/notification', async (req, res) => {
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
    const { status=1 } = req.body;
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
    const user_id = req.user.user_id;
    const { pagination, filters, search_text } = req.body;
    const result = await apigw.transactionSearch({ user_id, pagination, filters, search_text });
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
// CHUẨN HÓA: Tạo transaction mới
router.post('/transaction', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const data = { ...req.body, user_id };
    const result = await apigw.transactionCreate(data);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/transaction/:id', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { jar } = req.body;
    const { id } = req.params;
    const result = await apigw.transactionClassify({ user_id, id, category_label: jar });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== JAR ==========
router.get('/jar', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { year_month } = req.query;
    const result = await apigw.jarGet({ user_id, year_month });
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
    const { jars, income } = req.body;
    const result = await apigw.jarUpdatePercent({ user_id, jars, income });
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
router.post('/goal/set', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { total_monthly_amount, goals } = req.body.data;
    console.log({ user_id, data: {total_monthly_amount, goals} }, req.body)
    const result = await apigw.goalCreateBatch({ user_id, data: {total_monthly_amount, goals} });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/goal/search', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await apigw.goalSearch({ user_id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/goal/allocate', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { sent_amount } = req.body;
    const result = await apigw.goalAllocate({ user_id, sent_amount });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/goal/pause/:goal_id', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { goal_id } = req.params;
    const result = await apigw.goalPause({ user_id, goal_id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/goal/:goal_id', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { goal_id } = req.params;
    const result = await apigw.goalRemove({ user_id, goal_id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ========== AI ==========
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


module.exports = router; 