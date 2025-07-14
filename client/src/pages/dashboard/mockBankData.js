export const banks = [
  {
    code: 'vpb',
    name: 'VPBank',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Logo_VPBank.png',
  },
];

export const mockTransactions = {
  vpb: [
    // January 2024
    { description: 'Salary Jan', amount: 14000000, date: '2024-01-25' },
    { description: 'Groceries', amount: -1200000, date: '2024-01-26' },
    { description: 'Utilities', amount: -400000, date: '2024-01-27' },
    // February 2024 (Necessities vượt mức)
    { description: 'Salary Feb', amount: 14000000, date: '2024-02-25' },
    { description: 'Groceries', amount: -9000000, date: '2024-02-26' }, // Necessities (vượt mức)
    { description: 'Utilities', amount: -400000, date: '2024-02-27' },
    // March 2024
    { description: 'Salary Mar', amount: 14000000, date: '2024-03-25' },
    { description: 'Books', amount: -250000, date: '2024-03-26' },
    { description: 'Transport', amount: -300000, date: '2024-03-27' },
    // April 2024
    { description: 'Salary Apr', amount: 14000000, date: '2024-04-25' },
    { description: 'Entertainment', amount: -600000, date: '2024-04-26' },
    { description: 'Groceries', amount: -1000000, date: '2024-04-27' },
    // May 2024 (Long-term Savings vượt mức)
    { description: 'Salary May', amount: 14000000, date: '2024-05-25' },
    { description: 'Shopping', amount: -900000, date: '2024-05-26' },
    { description: 'Chuyển tiền tiết kiệm', amount: -9000000, date: '2024-05-27' }, // LTSS (vượt mức)
    // June 2024 (đủ 6 jar, Play vượt mức)
    { description: 'Salary Jun', amount: 14000000, date: '2024-06-25' },
    { description: 'Ăn uống', amount: -1200000, date: '2024-06-26' }, // Necessities
    { description: 'Đầu tư', amount: -800000, date: '2024-06-26' }, // FFA
    { description: 'Chuyển tiền tiết kiệm', amount: -1000000, date: '2024-06-27' }, // LTSS
    { description: 'Mua sách', amount: -500000, date: '2024-06-27' }, // Education
    { description: 'Mua đồ chơi', amount: -300000, date: '2024-06-27' }, // Play
    { description: 'Từ thiện', amount: -200000, date: '2024-06-27' }, // Give
    { description: 'Giải trí', amount: -5000000, date: '2024-06-28' }, // Play (vượt mức)
    { description: 'Tiết kiệm Mua xe máy', amount: 2000000, date: '2024-06-28' },
    { description: 'Tiết kiệm Du lịch Đà Nẵng', amount: 1000000, date: '2024-06-28' },
    { description: 'Tiết kiệm Quỹ khẩn cấp', amount: 1500000, date: '2024-06-28' },
    { description: 'Thanh toán điện thoại', amount: -200000, date: '2024-06-26' },
    { description: 'Mua đồ ăn nhanh', amount: -150000, date: '2024-06-27' },
    { description: 'Chuyển tiền tiết kiệm', amount: -1200000, date: '2024-06-27' },
    { description: 'Tiền lãi tiết kiệm', amount: 45000, date: '2024-06-28' },
    { description: 'Mua sách', amount: -250000, date: '2024-06-27' },
    { description: 'Học phí', amount: -500000, date: '2024-06-27' },
    { description: 'Mua đồ chơi', amount: -300000, date: '2024-06-27' },
    { description: 'Giải trí', amount: -200000, date: '2024-06-27' },
    { description: 'Từ thiện', amount: -100000, date: '2024-06-27' },
    { description: 'Cho mẹ', amount: -500000, date: '2024-06-27' },
    { description: 'Đầu tư', amount: -400000, date: '2024-06-27' },
    { description: 'Salary Jan', amount: 14000000, date: '2025-01-25' },
    { description: 'Groceries', amount: -1500000, date: '2025-01-26' },
    { description: 'Utilities', amount: -500000, date: '2025-01-27' },
    { description: 'Books', amount: -300000, date: '2025-01-28' },
    { description: 'Tiết kiệm Mua xe máy', amount: 2500000, date: '2025-01-29' },
    { description: 'Salary Feb', amount: 14000000, date: '2025-02-25' },
    { description: 'Shopping', amount: -1200000, date: '2025-02-26' },
    { description: 'Chuyển tiền tiết kiệm', amount: -2000000, date: '2025-02-27' },
    { description: 'Mua sách', amount: -400000, date: '2025-02-28' },
    { description: 'Giải trí', amount: -800000, date: '2025-02-28' },
    { description: 'Salary Mar', amount: 14000000, date: '2025-03-25' },
    { description: 'Ăn uống', amount: -1300000, date: '2025-03-26' },
    { description: 'Đầu tư', amount: -1000000, date: '2025-03-27' },
    { description: 'Từ thiện', amount: -300000, date: '2025-03-28' },
    { description: 'Tiết kiệm Du lịch Đà Nẵng', amount: 3000000, date: '2025-03-29' },
  ],
}; 