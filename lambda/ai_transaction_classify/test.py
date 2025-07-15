from index import lambda_handler

if __name__ == '__main__':
    test_cases = [
        {
            "name": "Trường hợp phân loại ngay vì tranx_type là 'expense'",
            "input": {
                "user_id": "user-001",
                "amount": 100000,
                "txn_time": "2025-07-10T08:30:00Z",
                "msg_content": "Ăn sáng",
                "merchant": "Phở 24",
                "to_account_name": None,
                "location": "Hanoi",
                "channel": "manual",
                "tranx_type": "expense",
                "category_label": "NEC"
            },
            "expected_label": "NEC"
        },
        {
            "name": "Phân loại từ keyword 'grab' trong msg_content",
            "input": {
                "user_id": "user-002",
                "amount": 250000,
                "txn_time": "2025-07-10T08:30:00Z",
                "msg_content": "Thanh toán Grab",
                "merchant": "Grab",
                "to_account_name": None,
                "location": "Hanoi",
                "channel": "manual",
                "tranx_type": "qrcode_payment",
                "category_label": "NEC"
            },
            "expected_label": "NEC"
        },
        {
            "name": "Phân loại từ keyword 'netflix' → PLAY",
            "input": {
                "user_id": "user-003",
                "amount": 99000,
                "txn_time": "2025-07-10T08:30:00Z",
                "msg_content": "Thanh toán dịch vụ",
                "merchant": "Netflix",
                "to_account_name": None,
                "location": "HCMC",
                "channel": "auto",
                "tranx_type": "qrcode_payment",
                "category_label": "NEC"
            },
            "expected_label": "PLAY"
        },
        {
            "name": "Không có keyword nào khớp → NEC",
            "input": {
                "user_id": "user-004",
                "amount": 100000,
                "txn_time": "2025-07-10T08:30:00Z",
                "msg_content": "abc xyz",
                "merchant": "def ghi",
                "to_account_name": None,
                "location": "Danang",
                "channel": "manual",
                "tranx_type": "qrcode_payment",
                "category_label": "NEC"
            },
            "expected_label": "NEC"
        }
    ]

    passed = 0
    for case in test_cases:
        print(f"▶ Testing: {case['name']}")
        result = lambda_handler(case["input"], None)
        label = result["label"]
        print(f"  Output label: {label}")
        print(f"  Message: {result['response_msg']}")
        assert label == case["expected_label"], f"❌ Failed: expected {case['expected_label']}, got {label}"
        print("  ✅ Passed\n")
        passed += 1

    print(f"{passed}/{len(test_cases)} test cases passed.")
