// Mock data for users
export const mockUsers = [
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

// Generate 300 mock transactions from Jan 2025 to now
function generateMockTransactions() {
  const jarCodes = ['NEC', 'FFA', 'LTSS', 'Education', 'Play', 'Give'];
  const merchants = ['Fahasa', 'VPBank', 'Lotteria', 'Circle K', 'Vinmart', 'Grab', 'Shopee', 'Tiki', 'CGV', 'Highlands', 'Starbucks'];
  const descriptions = [
    'Mua sách', 'Ăn sáng', 'Ăn trưa', 'Ăn tối', 'Mua cà phê', 'Đi xem phim', 'Mua đồ chơi', 'Tiết kiệm', 'Lương tháng', 'Chuyển tiền tiết kiệm',
    'Đầu tư', 'Từ thiện', 'Học phí', 'Mua sắm', 'Du lịch', 'Giải trí', 'Thanh toán điện', 'Thanh toán nước', 'Shopping', 'Mua quà', 'Tiền lãi tiết kiệm'
  ];
  const user_id = 'user-001';
  const txs = [];
  let currentDate = new Date('2025-01-01T08:00:00Z');
  const now = new Date();
  for (let i = 0; i < 300; i++) {
    // Cách nhau 2 ngày
    currentDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    if (currentDate > now) currentDate = new Date(now.getTime() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000));
    const isIncome = i % 7 === 0;
    const jarIdx = isIncome ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * jarCodes.length);
    const jarCode = jarCodes[jarIdx];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const desc = isIncome ? `Lương tháng ${currentDate.getMonth() + 1}` : descriptions[Math.floor(Math.random() * descriptions.length)];
    const amount = isIncome ? 1000000 + Math.floor(Math.random() * 5000000) : - (50000 + Math.floor(Math.random() * 2000000));
    txs.push({
      transaction_id: `tx-${i + 1}`,
      user_id,
      amount,
      txn_time: currentDate.toISOString(),
      msg_content: desc,
      merchant,
      to_account_name: 'Nguyen Van A',
      location: 'HCM',
      channel: isIncome ? 'bank_sync' : 'sms',
      tranx_type: isIncome ? 'income' : 'expense',
      category_label: jarCode,
      is_manual_override: false,
      created_at: currentDate.toISOString(),
      updated_at: currentDate.toISOString()
    });
  }
  return txs;
}

export const mockTransactions = generateMockTransactions();

// Generate notifications: every 10th transaction gets a jar_classification notification
export const mockNotifications = [
  ...mockTransactions.filter((tx, idx) => idx % 10 === 0).map(tx => ({
    notification_id: `noti-tx-${tx.transaction_id}`,
    user_id: tx.user_id,
    notification_type: 'jar_classification',
    title: 'Phân loại giao dịch',
    message: `Giao dịch "${tx.msg_content}" cần xác nhận phân loại.
Số tiền: ${tx.amount.toLocaleString()}đ`,
    severity: 'info',
    object_code: 'transaction',
    object_id: tx.transaction_id,
    action_url: `/transactions/${tx.transaction_id}`,
    status: 0,
    created_at: tx.txn_time
  })),
  // Thêm 3 noti cho goals
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
    created_at: '2025-01-10T08:00:00Z'
  },
  {
    notification_id: 'noti-goal-002',
    user_id: 'user-001',
    notification_type: 'goal_created',
    title: 'Tạo mục tiêu mới',
    message: 'Bạn đã tạo mục tiêu tiết kiệm "Mua xe máy".',
    severity: 'info',
    object_code: 'goal',
    object_id: 'goal-002',
    action_url: '/goals/goal-002',
    status: 0,
    created_at: '2025-02-15T08:00:00Z'
  },
  {
    notification_id: 'noti-goal-003',
    user_id: 'user-001',
    notification_type: 'goal_created',
    title: 'Tạo mục tiêu mới',
    message: 'Bạn đã tạo mục tiêu tiết kiệm "Quỹ khẩn cấp".',
    severity: 'info',
    object_code: 'goal',
    object_id: 'goal-003',
    action_url: '/goals/goal-003',
    status: 0,
    created_at: '2025-03-20T08:00:00Z'
  }
];

// 3 saving goals
export const mockSavingGoals = [
  {
    goal_id: 'goal-001',
    user_id: 'user-001',
    goal_name: 'Du lịch Đà Nẵng',
    target_amount: 10000000,
    current_amount: 2000000,
    target_date: '2025-12-31',
    goal_type: 'travel',
    priority_level: 1,
    is_active: true,
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2025-06-01T08:00:00Z'
  },
  {
    goal_id: 'goal-002',
    user_id: 'user-001',
    goal_name: 'Mua xe máy',
    target_amount: 20000000,
    current_amount: 5000000,
    target_date: '2025-10-31',
    goal_type: 'vehicle',
    priority_level: 2,
    is_active: true,
    created_at: '2025-02-15T08:00:00Z',
    updated_at: '2025-06-01T08:00:00Z'
  },
  {
    goal_id: 'goal-003',
    user_id: 'user-001',
    goal_name: 'Quỹ khẩn cấp',
    target_amount: 15000000,
    current_amount: 3000000,
    target_date: '2025-09-30',
    goal_type: 'emergency',
    priority_level: 1,
    is_active: true,
    created_at: '2025-03-20T08:00:00Z',
    updated_at: '2025-06-01T08:00:00Z'
  }
];

// 3 user_jar_spending entries
export const mockUserJarSpending = [
  {
    user_id: 'user-001',
    jar_code: 'NEC',
    virtual_budget_amount: 3000000,
    spent_amount: 1200000,
    remaining_budget: 1800000,
    last_income_allocation: '2025-06-01T09:00:00Z',
    last_spending_date: '2025-06-10T10:30:00Z',
    created_at: '2025-01-01T08:00:00Z',
    updated_at: '2025-06-10T10:30:00Z'
  },
  {
    user_id: 'user-001',
    jar_code: 'FFA',
    virtual_budget_amount: 2000000,
    spent_amount: 500000,
    remaining_budget: 1500000,
    last_income_allocation: '2025-06-01T09:00:00Z',
    last_spending_date: '2025-06-09T10:30:00Z',
    created_at: '2025-01-01T08:00:00Z',
    updated_at: '2025-06-09T10:30:00Z'
  },
  {
    user_id: 'user-001',
    jar_code: 'LTSS',
    virtual_budget_amount: 5000000,
    spent_amount: 2000000,
    remaining_budget: 3000000,
    last_income_allocation: '2025-06-01T09:00:00Z',
    last_spending_date: '2025-06-08T10:30:00Z',
    created_at: '2025-01-01T08:00:00Z',
    updated_at: '2025-06-08T10:30:00Z'
  }
]; 