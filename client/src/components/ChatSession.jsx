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
        {
          user_prompt: 'test',
          user_time: null,
          ai_time: Date.now(),
          ai_answer: "Dựa trên thông tin từ VPBank, tôi tìm thấy một số dịch vụ hữu ích cho việc du học mà bạn nên cân nhắc:\n\n## 1. **Cho vay hỗ trợ tài chính du học** ⭐\n\nĐây là sản phẩm chính dành cho du học với những ưu điểm:\n\n**Lợi ích chính:**\n- 🏦 **Hạn mức vay**: Lên đến 300 triệu đồng\n- 💰 **Tài trợ**: Lên đến 70% giá trị học phí\n- ⏰ **Kỳ hạn**: Linh hoạt lên đến 60 tháng\n- 🚀 **Thủ tục**: Phê duyệt và giải ngân nhanh chóng\n- 💸 **Lãi suất**: Ưu đãi cho vay du học\n\n**Điều kiện:**\n- Quốc tịch Việt Nam\n- Độ tuổi từ 23-60 tuổi\n- Lưu ý: Chỉ cho vay đối với cha/mẹ/anh chị em ruột của người đi du học\n\n**Thủ tục cần thiết:**\n- CMND/Hộ chiếu (bản sao)\n- Sổ hộ khẩu/Xác nhận tạm trú (bản sao)  \n- Xác nhận học phí từ Trường/Trung tâm đào tạo (bản chính)\n\n[Chi tiết sản phẩm tại đây](https://www.vpbank.com.vn/ca-nhan/vay/vay-du-hoc)\n\n## 2. **Dịch vụ Western Union**\n\nHữu ích cho việc chuyển/nhận tiền quốc tế trong quá trình du học:\n\n**Tính năng:**\n- 💸 **Nhận tiền từ nước ngoài** về Việt Nam tại quầy\n- 🌍 **Gửi tiền** từ Việt Nam ra nước ngoài\n- 🏦 **Nhận tiền trực tiếp** vào tài khoản (APN)\n\n**Lợi ích:**\n- Người nhận không phải đóng phí\n- Không cần mở tài khoản để nhận tiền\n- Có thể nhận bằng USD hoặc VND\n\n[Tìm hiểu thêm về Western Union](https://www.vpbank.com.vn/ca-nhan/dich-vu-ca-nhan/dich-vu-western-union)\n\n**Gợi ý:** Bạn nên liên hệ trực tiếp với VPBank để được tư vấn cụ thể về gói vay du học phù hợp với nhu cầu và khả năng tài chính của mình nhé!",
          used_tools: [
            {
              "tool_name": "retrieve_financial_products",
              "query": "du học study abroad education loan financing services",
              "results": [
                {
                  "source": "s3://vpb-finserv-web/Cho_vay_hỗ_trợ_tài_chính_du_học.txt",
                  "content": "Source URL for reference: https://www.vpbank.com.vn/ca-nhan/vay/vay-du-hoc\r Title: Cho vay hỗ trợ tài chính du học\r \r <SECTION> Giới thiệu chung\r Cho vay du học/ Cho vay học tập là chương trình cho vay đối với khách hàng có nhu cầu học tập để phát triển bản thân\r \r <SECTION> Tính năng nổi bật\r Tài trợ lên đến 70% giá trị học phí các khóa học Ngoại ngữ/ Nghề/ Thạc sĩ/ Du học/ Trường tư thục\r Cho vay du học/ cho vay học tập với lãi suất ưu đãi\r \r <SECTION> Lợi ích\r Hạn mức cho vay lên đến 300 triệu đồng\r Kỳ hạn cho vay linh hoạt lên đến 60 tháng\r Phê duyệt và giải ngân nhanh chóng\r \r <SECTION> Điều kiện đăng ký\r Quốc tịch: Việt Nam\r Độ tuổi: Từ 23 đến 60 tuổi\r \r <SECTION> Thủ tục đăng ký\r Chứng minh nhân dân/ Hộ chiếu (Bản sao)\r Sổ hộ khẩu/ Xác nhận tạm trú (Bản sao)\r Xác nhận học phí từ Trường/Trung tâm đào tạo (Bản chính)\r \r <SECTION> Thông tin cần thiết\r Điều kiện giao dịch chung về cho vay từng lần không tài sản bảo đảm:\r Download tại đây\r Điều kiện giao dịch chung về cho vay thấu chi không tài sản bảo đảm:\r Download tại đây\r \r <SECTION> Hỏi đáp\r Tôi hiện",
                  "score": 0.47124168
                },
                {
                  "source": "s3://vpb-finserv-web/Cho_vay_hỗ_trợ_tài_chính_du_học.txt",
                  "content": "tin cần thiết\r Điều kiện giao dịch chung về cho vay từng lần không tài sản bảo đảm:\r Download tại đây\r Điều kiện giao dịch chung về cho vay thấu chi không tài sản bảo đảm:\r Download tại đây\r \r <SECTION> Hỏi đáp\r Tôi hiện đang có nhu cầu đi du học, thì tôi có được vay vốn không?\r Trường hợp này chỉ cho vay đối với cha/mẹ/anh chị em ruột của người đi du học.\r \r Tôi muốn vay tiền cho con cái đi học phổ thông có được không?\r Hoàn toàn có thể\r \r Tôi có thể vay 100% tiền học phí được không?\r Ngân hàng chỉ tài trợ tối đa 70% giá trị khóa học. Khách hàng phải tự thanh toán 30% còn lại.\r \r Học thạc sĩ khoảng 2 năm, nhưng tôi muốn vay 5 năm thì có được không?\r Hoàn toàn có thể\r \r Ngân hàng có danh sách các trường học hay trung tâm không hay áp dụng cho tất cả các trường luôn?\r Sản phẩm chỉ áp dụng đối với các trường học có hợp tác với VPBank.",
                  "score": 0.44517624
                },
                {
                  "source": "s3://vpb-finserv-web/Dịch_vụ_Western_Union.txt",
                  "content": "Source URL for reference: https://www.vpbank.com.vn/ca-nhan/dich-vu-ca-nhan/dich-vu-western-union\r Title: Dịch vụ Western Union\r \r <SECTION> Giới thiệu chung\r Dịch vụ Western Union là kênh thanh toán dành cho các khách hàng nhận tiền và gửi tiền từ nước ngoài về Việt Nam hoặc từ Việt Nam ra nước ngoài.\r \r <SECTION> Tính năng nổi bật\r Nhận tiền tại quầy:\r Cá nhân có hoặc không có tài khoản tại ngân hàng có thể nhận tiền từ nước ngoài về bằng giấy tờ tùy thân thông qua dịch vụ Western Union.\r Gửi tiền tại quầy:\r Cá nhân có/không có tài khoản tại Ngân hàng có thể gửi tiền từ Việt Nam ra nước ngoài thông qua dịch vụ Western Union theo các mục đích quy định của Ngân hàng nhà nước và của VPBank đến cá nhân hoặc công ty có mở tài khoản tại công ty Western Union.\r Nhận tiền thông qua tài khoản (APN):\r Người gửi từ nước ngoài yêu cầu chuyển tiền về Việt Nam vào tài khoản cho người nhận. VPBank sẽ trực tiếp ghi có số tiền VND vào tài khoản của người nhận.\r \r <SECTION> Lợi ích\r Nhận tiền tại quầy:\r + Nhận bằng USD hoặc VND.\r + Người nhận không phải đóng bất cứ khoản phí nào.\r + Người nhận không phải mở tài khoản.\r + Người nhận không phải đóng thuế thu nhập.",
                  "score": 0.39221603
                },
                {
                  "source": "s3://vpb-finserv-web/Vay_tín_chấp_làm_đẹp_và_chăm_sóc_sức_khỏe_Beauty_Up.txt",
                  "content": "không tài sản bảo đảm:\r Download tại đây\r \r <SECTION> Hỏi đáp\r Tôi có thể xem danh sách các đối tác thẩm mỹ có liên kết với VPBank ở đâu?\r Quý khách có thể truy cập website https://uudaicanhan.vpbank.com.vn/beautyup để tìm hiểu thêm thông tin về các đối tác của VPBank.\r \r Tôi có nhu cầu vay tại VPBank để mua gói dịch vụ thẩm mỹ 100 triệu đồng. Tôi có cần cung cấp hồ sơ chứng minh thu nhập không?\r Quý khách có thể lựa chọn 1 trong 2 hình thức: - Thanh toán tối thiểu 40% giá trị gói dịch vụ và vay VPBank 60% giá trị còn lại: không yêu cầu cung cấp chứng từ chứng minh thu nhập - Vay VPBank 100% giá trị gói dịch vụ: cần cung cấp các chứng từ chứng minh thu nhập.\r \r Hàng tháng tôi sẽ thanh toán gốc lãi khoản vay cho đối tác hay cho VPBank?\r Để thanh toán gốc lãi khoản vay hàng tháng, Quý khách có thể nộp tiền hoặc chuyển khoản vào tài khoản của Quý khách mở tại VPBank",
                  "score": 0.3895365
                },
                {
                  "source": "s3://vpb-finserv-web/Vay_kinh_doanh.txt",
                  "content": "Hồ Chí Minh nhưng có ý định kinh doanh dịch vụ Homestay tại Đà Nẵng. Vậy tôi có được phép vay vốn kinh doanh không?\r Có thể. VPBank cung cấp sản phẩm vay vốn kinh doanh cho các cá nhân đang kinh doanh tại Việt Nam, không giới hạn về địa điểm hoạt động kinh doanh. Vì vậy, nếu bạn đang sinh sống và làm việc tại Hà Nội nhưng muốn kinh doanh homestay tại Đà Nẵng, bạn vẫn có thể vay vốn kinh doanh từ VPBank để thực hiện dự án của mình. Tuy nhiên, để được vay vốn kinh doanh, bạn cần đáp ứng một số tiêu chuẩn và điều kiện của VPBank, bao gồm có: Có độ tuổi từ 20 đến 65 (tùy theo từng sản phẩm vay). Có khả năng trả nợ. Có giấy tờ chứng minh nhân dân, hộ khẩu và giấy phép kinh doanh (nếu có). Có phương án kinh doanh cụ thể và khả năng tạo lợi nhuận. Có tài sản thế chấp hoặc bảo đảm khác (nếu yêu cầu). Và quý khách cần phải lưu ý tài sản đảm bảo phải chỉ được chấp nhận tại nơi có chi nhánh của VPBank.\r \r Tôi có thể dùng tài sản của người khác để thế chấp cho sản phẩm vay vốn kinh doanh được không?",
                  "score": 0.38716868
                },
                {
                  "source": "s3://vpb-finserv-web/Dịch_vụ_chuyển_tiền_trong_nước.txt",
                  "content": "Source URL for reference: https://www.vpbank.com.vn/ca-nhan/dich-vu-ca-nhan/dich-vu-chuyen-tien-trong-nuoc\r Title: Dịch vụ chuyển tiền trong nước\r \r <SECTION> Giới thiệu chung\r VPBank với nền tảng công nghệ ngân hàng hiện đại, mạng lưới chi nhánh trải rộng trên toàn quốc mang đến khách hàng dịch vụ chuyển hoặc nhận tiền trong nước thuận tiện và nhanh chóng.\r \r <SECTION> Tính năng nổi bật\r Chuyển tiền trong nước không hạn chế số tiền chuyển và số lần chuyển\r Khách hàng có tài khoản hoặc không có tài khoản tại VPBank đều có thể chuyển tiền.\r Có thể thực hiện chuyển tiền trong nước tại quầy giao dịch, qua máy ATM, hoặc trên dịch vụ VPBank Online.\r \r <SECTION> Lợi ích\r Chuyển tiền cho người nhận trên phạm vi lãnh thổ Việt Nam nhanh chóng, an toàn nhất đáp ứng kịp thời nhu cầu của khách hàng trong việc thực hiện các hợp đồng kinh tế, đảm bảo tận dụng được các cơ hội kinh doanh của khách hàng.\r Khách hàng có thể nhận tiền đến và rút tiền bằng Chứng minh Nhân dân hoặc tài khoản mở tại VPBank tại bất cứ điểm giao dịch nào của VPBank\r Chuyển tiền đến VPBank hoặc trong hệ thống VPBank nguời hưởng sẽ nhận được tiền ngay trong ngày làm việc.",
                  "score": 0.38555706
                }
              ]
            }
          ]
        }        
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
    const newHistory = [
      ...history,
      { user_prompt: input, ai_answer: '', used_tools: [], user_time: now, ai_time: null }
    ];
    setHistory(newHistory);
    setInput("");
    // 2. Gọi API lấy trả lời AI
    const apiHistory = newHistory.map(({ user_prompt, ai_answer, used_tools, user_time, ai_time }) => ({
      user_prompt, ai_answer, used_tools: used_tools || [], user_time, ai_time
    }));
    try {
      const { data } = await axios.post("/ai/qna/session", {
        user_id: userId,
        history: apiHistory,
        prompt: input,
      });
      // 3. Cập nhật trả lời AI vào đúng vị trí
      setHistory(h => h.map((msg, idx) =>
        idx === newHistory.length - 1
          ? { ...msg, ai_answer: data.ai_answer, used_tools: data.used_tools || [], ai_time: Date.now() }
          : msg
      ));
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
  }, [input, history, userId, loading]);

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
        padding: '8px 14px 8px 14spx',
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
