Dưới đây là phần **Chi tiết tính năng** cho file `README.md`, được biên soạn dựa trên nội dung từ tài liệu **SRS Documentation**, mô tả rõ ràng từng tính năng của ứng dụng **SmartJarvis** – theo nhóm tính năng và mức độ ưu tiên (MoSCoW).

---

```markdown
## 🔍 Chi Tiết Tính Năng

### 1. Onboarding & Setup
- **1.1 Link Bank Account (Must Have)**  
  Kết nối tài khoản ngân hàng hoặc nguồn lương của người dùng thông qua OAuth/API để nhận giao dịch về hệ thống.

- **1.2 Customize Jar Percentages (Must Have)**  
  Cho phép người dùng tùy chỉnh tỷ lệ phân bổ vào 6 lọ tài chính:  
  `Necessities`, `FFA`, `Education`, `LTSS`, `Play`, `Give`.

- **1.3 Enable Auto-Classification (Must Have)**  
  Kích hoạt mô-đun phân loại giao dịch tự động theo thời gian thực.

---

### 2. Transaction Classification
- **2.1 Auto-Classify Transaction (Must Have)**  
  Mỗi giao dịch mới sẽ được gọi mô hình ML để tự động phân loại vào một trong 6 lọ.

- **2.2 Review & Edit Classification (Must Have)**  
  Giao diện cho phép người dùng xác nhận hoặc chỉnh sửa kết quả phân loại.

- **2.3 Classification API (Could Have)**  
  API REST để gửi giao dịch và nhận kết quả phân loại từ bên thứ ba.  
  `POST /api/v1/classify-transaction`

---

### 3. Goal Management
- **3.1 Add Savings Goal (Must Have)**  
  Tạo mục tiêu tiết kiệm mới với số tiền và mức độ ưu tiên.

- **3.2 Estimate ETA (Should Have)**  
  Tự động ước lượng ngày hoàn thành mục tiêu dựa trên lịch sử tiết kiệm.

- **3.3 Accept or Override ETA (Should Have)**  
  Người dùng có thể chấp nhận ETA hoặc tự nhập ngày mục tiêu.

- **3.4 Adjust Goal ETA (Should Have)**  
  Cho phép người dùng điều chỉnh ETA sau khi đã tạo.

- **3.5 Transfer Savings Between Goals (Could Have)**  
  Cho phép chuyển tiền giữa các mục tiêu và cập nhật lại ETA tương ứng.

- **3.6 View Goals Tracking (Must Have)**  
  Hiển thị tiến độ từng mục tiêu với thanh % và trạng thái (đúng tiến độ/trễ).

---

### 4. Dashboard & Insights
- **4.1 View Jars Dashboard (Must Have)**  
  Giao diện tổng quan các lọ: số dư, chi tiêu so với kế hoạch, biểu đồ trực quan.

- **4.2 View Goals Dashboard (Must Have)**  
  Bảng tổng hợp tiến độ các mục tiêu: số tiền, % hoàn thành, deadline.

- **4.3 Generate Personalized Insights (Should Have)**  
  Sử dụng LLM để sinh cảnh báo/tip/cảnh cáo như:  
  _"Bạn đang tiêu quá 10% so với kế hoạch cho Education jar."_

- **4.4 Visualize Trends (Could Have)**  
  Biểu đồ đường hiển thị xu hướng tiêu dùng và tiết kiệm theo thời gian.

---

### 5. Notifications & Alerts
- **5.1 Rule-Based Alert Evaluation (Must Have)**  
  Đánh giá từng giao dịch/mục tiêu theo rule (ví dụ: >10% overspend).

- **5.2 Compose AI-Powered Notification (Should Have)**  
  Dùng LLM để tạo nội dung cảnh báo/nudge mang tính cá nhân hóa.

- **5.3 Deliver & Log Notification (Must Have)**  
  Gửi cảnh báo qua push/email/in-app và lưu log để tra cứu sau.

- **5.4 View Notification Center (Should Have)**  
  Trung tâm thông báo: xem lại cảnh báo cũ, lọc theo mục tiêu/lọ, đánh dấu đã đọc.

---

## 📋 Bảng Ưu Tiên Tính Năng

| Epic                    | Tính năng                              | Mức ưu tiên     |
|------------------------|----------------------------------------|-----------------|
| Onboarding & Setup     | Link Bank Account                      | Must Have       |
|                        | Customize Jar Percentages              | Must Have       |
|                        | Enable Auto-Classification             | Must Have       |
| Transaction            | Auto-Classify Transaction              | Must Have       |
| Classification         | Review & Edit Classification           | Must Have       |
|                        | Classification API                     | Could Have      |
| Goal Management        | Add Savings Goal                       | Must Have       |
|                        | Estimate ETA                           | Should Have     |
|                        | Accept or Override ETA                 | Should Have     |
|                        | Adjust Goal ETA                        | Should Have     |
|                        | Transfer Savings Between Goals         | Could Have      |
|                        | View Goals Tracking                    | Must Have       |
| Dashboard & Insights   | View Jars Dashboard                    | Must Have       |
|                        | View Goals Dashboard                   | Must Have       |
|                        | Generate Personalized Insights         | Should Have     |
|                        | Visualize Trends                       | Could Have      |
| Notifications & Alerts | Rule-Based Alert Evaluation            | Must Have       |
|                        | Compose AI-Powered Notification        | Should Have     |
|                        | Deliver & Log Notification             | Must Have       |
|                        | View Notification Center               | Should Have     |

```

---