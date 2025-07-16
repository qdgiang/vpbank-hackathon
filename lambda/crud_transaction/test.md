# Test Events for Lambda: crud_transaction

## 1. Tạo transaction mới (create)
### Event: create_transaction
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"amount\": 50000, \"txn_time\": \"2024-07-16T10:00:00\", \"msg_content\": \"Mua cafe\", \"merchant\": \"Highlands\", \"tranx_type\": \"expense\", \"category_label\": \"coffee\"}",
  "httpMethod": "POST",
  "path": "/create"
}
```

## 2. Tìm kiếm transaction (search)
### Event: search_transactions
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"pagination\": {\"page_size\": 10, \"current\": 1}, \"filters\": {\"tranx_type\": \"expense\"}, \"search_text\": \"cafe\"}",
  "httpMethod": "POST",
  "path": "/search"
}
```

## 3. Phân loại transaction (classify)
### Event: classify_transaction
```json
{
  "pathParameters": {"id": "<transaction_id>"},
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"category_label\": \"food\"}",
  "httpMethod": "PATCH",
  "path": "/<transaction_id>/classify"
}
```

## 4. Tạo transaction lỗi (amount âm)
### Event: create_transaction_invalid_amount
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"amount\": -100, \"txn_time\": \"2024-07-16T10:00:00\"}",
  "httpMethod": "POST",
  "path": "/create"
}
```

## 5. Tìm kiếm transaction lỗi (page_size quá lớn)
### Event: search_transactions_invalid_page_size
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"pagination\": {\"page_size\": 1000, \"current\": 1}}",
  "httpMethod": "POST",
  "path": "/search"
}
``` 