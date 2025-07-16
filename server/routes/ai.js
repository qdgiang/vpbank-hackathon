const express = require("express");
const router = express.Router();
const axios = require("axios");

// Thay URL này bằng API Gateway endpoint thực tế của bạn
const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || "https://your-api-gw-domain/ai/qna/session";

router.post("/qna/session", async (req, res) => {
  try {
    const { user_id, history, prompt } = req.body;
    if (!user_id || !prompt) return res.status(400).json({ error: "Missing user_id or prompt" });

    // Forward tới API Gateway
    const { data } = await axios.post(AI_GATEWAY_URL, { user_id, history, prompt });
    // data: { ai_answer, used_tools }
    res.json(data);
  } catch (err) {
    console.error("AI session error:", err?.response?.data || err.message);
    res.status(500).json({ error: "AI service error" });
  }
});

module.exports = router;