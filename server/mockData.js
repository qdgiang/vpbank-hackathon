// Mock data for users
const users = [
  {
    user_id: 'user-001',
    email: 'test@example.com',
    phone: '0123456789',
    full_name: 'Nguyen Van A',
    date_of_birth: '1990-01-01',
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2024-06-20T10:00:00Z',
    is_active: true,
    timezone: 'Asia/Ho_Chi_Minh',
    city: 'HCM'
  }
];

// Mock data for transactions
const transactions = [
  {
    transaction_id: 'tx-001',
    user_id: 'user-001',
    amount: 150000,
    txn_time: '2024-06-20T10:30:00Z',
    msg_content: 'Mua sách Fahasa',
    merchant: 'Fahasa',
    to_account_name: 'Nguyen Van A',
    location: 'HCM',
    channel: 'bank_sync',
    tranx_type: 'expense',
    category_label: 'NEC',
    is_manual_override: false,
    created_at: '2024-06-20T10:31:00Z',
    updated_at: '2024-06-20T10:31:00Z'
  },
  {
    transaction_id: 'tx-002',
    user_id: 'user-001',
    amount: 2000000,
    txn_time: '2024-06-21T09:00:00Z',
    msg_content: 'Lương tháng 6',
    merchant: 'VPBank',
    to_account_name: 'Nguyen Van A',
    location: 'HCM',
    channel: 'bank_sync',
    tranx_type: 'income',
    category_label: 'FFA',
    is_manual_override: false,
    created_at: '2024-06-21T09:01:00Z',
    updated_at: '2024-06-21T09:01:00Z'
  }
];

// Mock data for notifications
const notifications = [
  {
    notification_id: 'noti-tx-001',
    user_id: 'user-001',
    notification_type: 'jar_classification',
    title: 'Phân loại giao dịch',
    message: 'Giao dịch "Mua sách Fahasa" cần xác nhận phân loại.',
    severity: 'info',
    object_code: 'transaction',
    object_id: 'tx-001',
    action_url: '/transactions/tx-001',
    status: 0,
    created_at: '2024-06-20T10:32:00Z'
  },
  {
    notification_id: 'noti-goal-001',
    user_id: 'user-001',
    notification_type: 'goal_created',
    title: 'Tạo mục tiêu mới',
    message: 'Bạn đã tạo mục tiêu tiết kiệm "Du lịch Đà Nẵng".',
    severity: 'info',
    object_code: 'goal',
    object_id: 'goal-001',
    action_url: '/goals/goal-001',
    status: 0,
    created_at: '2024-06-21T08:00:00Z'
  }
];

// Mock data for goals
const goals = [
  {
    goal_id: 'goal-001',
    user_id: 'user-001',
    name: 'Du lịch Đà Nẵng',
    target_amount: 10000000,
    current_amount: 2000000,
    start_date: '2024-06-01',
    end_date: '2024-12-31',
    status: 'in_progress',
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2024-06-21T08:00:00Z'
  }
];

// Mock data for jars
const jars = [
  {
    jar_code: 'NEC',
    user_id: 'user-001',
    name: 'Necessities',
    percent: 55,
    current_balance: 5000000,
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2024-06-21T08:00:00Z'
  },
  {
    jar_code: 'FFA',
    user_id: 'user-001',
    name: 'Financial Freedom',
    percent: 10,
    current_balance: 2000000,
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2024-06-21T08:00:00Z'
  }
];

module.exports = { users, transactions, notifications, goals, jars }; 