# Test Events for Lambda: crud_jar

## 1. Khởi tạo JAR lần đầu (initialize)
### Event: init_first_time
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"income\": 10000000}",
  "httpMethod": "POST",
  "path": "/jar/initialize"
}
```

## 2. Khởi tạo JAR tháng mới, không truyền income, không truyền income_type
### Event: init_next_month_default
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\"}",
  "httpMethod": "POST",
  "path": "/jar/initialize"
}
```

## 3. Khởi tạo JAR tháng mới, income_type=1 (cộng dồn), không truyền income
### Event: init_next_month_cumulate
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"income_type\": 1}",
  "httpMethod": "POST",
  "path": "/jar/initialize"
}
```

## 4. Lấy danh sách JAR theo user_id (get_jar_list)
### Event: get_jar_list_current_month
```json
{
  "pathParameters": {"id": "000b1dd0-c880-45fd-8515-48dd705a3aa2"},
  "queryStringParameters": {"y_month": "2024-06"},
  "httpMethod": "GET",
  "path": "/jar/000b1dd0-c880-45fd-8515-48dd705a3aa2"
}
```

## 5. Lấy danh sách JAR theo user_id, không truyền y_month (lấy tất cả)
### Event: get_jar_list_all
```json
{
  "pathParameters": {"id": "000b1dd0-c880-45fd-8515-48dd705a3aa2"},
  "httpMethod": "GET",
  "path": "/jar/000b1dd0-c880-45fd-8515-48dd705a3aa2"
}
```

## 6. Cập nhật percent các JAR cho tháng hiện tại (không truyền y_month)
### Event: update_jar_percent
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"jars\": [ {\"jar_code\": \"NEC\", \"percent\": 50}, {\"jar_code\": \"FFA\", \"percent\": 10}, {\"jar_code\": \"LTSS\", \"percent\": 10}, {\"jar_code\": \"EDU\", \"percent\": 10}, {\"jar_code\": \"PLY\", \"percent\": 10}, {\"jar_code\": \"GIV\", \"percent\": 10} ]}",
  "httpMethod": "PUT",
  "path": "/jar/percent"
}
``` 

## 7. Cập nhật spent_amount cho jar (update_budget)
### Event: update_budget_existing
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"amount\": 100000, \"tranx_type\": \"expense\", \"category_label\": \"EDU\", \"y_month\": \"2024-07\"}",
  "httpMethod": "POST",
  "path": "/jar/update_budget"
}
```

### Event: update_budget_insert_new
```json
{
  "body": "{\"user_id\": \"000b1dd0-c880-45fd-8515-48dd705a3aa2\", \"amount\": 50000, \"tranx_type\": \"expense\", \"category_label\": \"PLY\", \"y_month\": \"2024-08\"}",
  "httpMethod": "POST",
  "path": "/jar/update_budget"
}
``` 