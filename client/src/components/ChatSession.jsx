import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icon } from '@iconify/react';
import {
    Typography
} from '@mui/material'
import ReactMarkdown from 'react-markdown';

const CHAT_HISTORY_KEY = "chatHistory";

const ChatSession = ({ userId, onLogout }) => {
  const [history, setHistory] = useState(() => {
    const saved = sessionStorage.getItem(CHAT_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Lưu history vào sessionStorage mỗi khi thay đổi
  useEffect(() => {
    sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Hiển thị message chào mừng khi mở chat lần đầu
  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        {
          user_prompt: '',
          ai_answer: 'Xin chào Anh/Chị, Em là Jarep - trợ lý chăm sóc khách hàng của SmartJarvis, rất vui được hỗ trợ Anh/Chị ạ.',
          used_tools: [],
          user_time: null,
          ai_time: Date.now()
        },
      ]);
    }
  }, []);

  // Xóa history khi logout
  useEffect(() => {
    if (!userId) {
      setHistory([]);
      sessionStorage.removeItem(CHAT_HISTORY_KEY);
    }
  }, [userId]);

  const formatTime = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('vi-VN', { hour12: false }) + ' ' + d.toLocaleDateString('vi-VN');
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const now = Date.now();
    // 1. Lưu user message vào history trước
    const history = JSON.parse(sessionStorage.getItem(CHAT_HISTORY_KEY) || '[]');
    const newHistory = [
      ...history,
      { user_prompt: input, ai_answer: '', used_tools: [], user_time: now, ai_time: null }
    ];
    setHistory(newHistory);
    setInput("");
    // 2. Gọi API lấy trả lời AI
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/qna/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          history: newHistory,
          prompt: input
        })
      });
      const data = await res.json();
      // 3. Cập nhật trả lời AI vào đúng vị trí và lưu vào sessionStorage
      const updatedHistory = newHistory.map((msg, idx) =>
        idx === newHistory.length - 1
          ? { ...msg, ai_answer: data.answer, used_tools: data.used_tools || [], ai_time: Date.now() }
          : msg
      );
      setHistory(updatedHistory);
      sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      // 4. Nếu lỗi, cập nhật trả lời AI là thông báo lỗi
      setHistory(h => h.map((msg, idx) =>
        idx === newHistory.length - 1
          ? { ...msg, ai_answer: 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.', ai_time: Date.now() }
          : msg
      ));
    } finally {
      setLoading(false);
    }
  }, [input, history, loading]);

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const SUGGESTED_PROMPTS = [
    "Tôi muốn gửi tiết kiệm ở VPBank, có những lựa chọn nào?",
    "Tôi muốn mua một chiếc ô tô. Bạn tư vấn giúp tôi cách tiết kiệm được không?",
    "Phân bổ tài chính của tôi đang ra sao, và làm thế nào để quản lý chi tiêu hiệu quả hơn?"
  ];

  return (
    <div className="chat-session" style={{width: 380, maxWidth: 400, margin: "0 auto", borderRadius: 20, boxShadow: "0 4px 24px #0002", background: "#fff", overflow: "hidden", border: 'none'}}>
      {/* Header chat */}
      <div style={{
        padding: '8px 14px 8px 14px',
        display: 'flex',
        alignItems: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'relative',
        background: '#fff'
      }}>
        <div style={{ flex: 1, lineHeight: 1 }}>
            <Typography
                variant="body"
                sx={{
                  background: '-webkit-linear-gradient(0,#e00200,#015aad,#00b74f)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: '#00000',
                  fontWeight: 'bold',
                  fontSize: 16
                }}
            >
                Jarep
            </Typography>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', color: '#000', fontSize: 22, cursor: 'pointer', marginLeft: 8, lineHeight: 1 }}>×</button>
      </div>
      {/* Prompt gợi ý */}
      {/* {!history.some(msg => msg.user_prompt && msg.user_prompt.trim()) && ( */}
        <div style={{ display: 'flex', gap: 5, margin: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInput(prompt)}
              style={{
                background: '#f0f7f4',
                color: '#007b55',
                border: 'none',
                borderRadius: 16,
                padding: '6px 16px',
                fontSize: 11,
                cursor: 'pointer',
                boxShadow: '0 1px 4px #e0e7ef',
                transition: 'background 0.2s, color 0.2s',
                marginBottom: 4,
              }}
              onMouseOver={e => e.currentTarget.style.background = '#d2f5e3'}
              onMouseOut={e => e.currentTarget.style.background = '#f0f7f4'}
            >
              {prompt}
            </button>
          ))}
        </div>
      {/* )} */}
      <div className="chat-history" style={{height: 300, overflowY: "auto", border: "1px solid #eee", padding: 16, background: "#fafbfc", borderRadius: 0, boxShadow: "none"}}>
        {history.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 18 }}>
            {/* User message */}
            {item.user_prompt && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <div style={{
                  background: '#00b74f', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '12px 12px', maxWidth: 200, fontSize: 12, fontWeight: 500,
                  boxShadow: '0 1px 4px #e0e7ef', marginLeft: 40,
                }}>{item.user_prompt}</div>
              </div>
            )}
            {item.user_prompt && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: 4 }}>
                <span style={{ fontSize: 9, color: '#bdbdbd', marginTop: 2 }}>{formatTime(item.user_time)}</span>
              </div>
            )}
            {/* AI message */}
            {item.ai_answer && (
              <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, border: '2px solid #fff', boxShadow: '0 1px 4px #e0e7ef' }}>
                  <Icon icon="arcticons:chores-and-allowance-bot" style={{ fontSize: 32, color: '#00b74f' }} />
                </div>
                <div style={{
                  background: '#f5f7fa', color: '#222', borderRadius: '18px 18px 18px 4px', padding: '12px 12px', maxWidth: 200, fontSize: 12, fontWeight: 500,
                  boxShadow: '0 1px 4px #e0e7ef', textAlign: 'left', minHeight: 24
                }}>
                  {item.isLoading ? (
                    <span className="ai-typing" style={{ letterSpacing: 2 }}>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                    </span>
                  ) : (
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h3 style={{fontWeight:700, fontSize:14, margin:'8px 0 4px'}} {...props} />,
                        h2: ({node, ...props}) => <h4 style={{fontWeight:700, fontSize:13, margin:'6px 0 3px'}} {...props} />,
                        h3: ({node, ...props}) => <h5 style={{fontWeight:700, fontSize:12, margin:'4px 0 2px'}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{paddingLeft:18, margin:'4px 0'}} {...props} />,
                        li: ({node, ...props}) => <li style={{marginBottom:2}} {...props} />,
                        a: ({node, ...props}) => <a style={{color:'#015aad', textDecoration:'underline'}} target="_blank" rel="noopener noreferrer" {...props} />,
                        p: ({node, ...props}) => <p style={{margin:'2px 0'}} {...props} />,
                        strong: ({node, ...props}) => <strong style={{color:'#007b55'}} {...props} />,
                      }}
                    >
                      {item.ai_answer}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            )}
            {item.ai_answer && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 44 }}>
                <span style={{ fontSize: 9, color: '#bdbdbd', marginTop: 2 }}>{formatTime(item.ai_time)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Input */}
      <div style={{marginTop: 12, display: "flex", gap: 8, padding: '0 8px 16px 8px', alignItems: 'center'}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
          style={{flex: 1, padding: '12px 16px', borderRadius: 24, border: "1px solid #ccc", fontSize: 15, outline: 'none', background: '#fff', boxShadow: '0 1px 4px #e0e7ef'}}
          placeholder="Nhập câu hỏi..."
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            boxShadow: '0 1px 4px #e0e7ef',
            transition: 'background 0.2s',
            color: '#fff',
            fontSize: 22,
          }}
        >
          <Icon icon="lets-icons:send-duotone" style={{ fontSize: 32, color: '#000' }} />
        </button>
      </div>
    </div>
  );
};

export default ChatSession;
