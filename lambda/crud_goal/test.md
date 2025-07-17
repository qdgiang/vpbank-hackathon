# Test CRUD Goal Lambda

## 1. Tạo Goal (Create)
- **Endpoint:** `/goal/create`
- **Method:** POST
- **Body:**
```json
{
  "user_id": "...",
  "goal_name": "Mua xe máy",
  "target_amount": 20000000,
  "priority": "high"
}
```
- **Expect:** 201, trả về goal mới tạo

## 2. Lấy danh sách Goal (Read)
- **Endpoint:** `/goal/list?user_id=...`
- **Method:** GET
- **Expect:** 200, trả về mảng goals

## 3. Cập nhật Goal (Update)
- **Endpoint:** `/goal/update`
- **Method:** PUT
- **Body:**
```json
{
  "goal_id": "...",
  "goal_name": "Mua xe mới",
  "target_amount": 25000000
}
```
- **Expect:** 200, trả về goal đã cập nhật

## 4. Xóa Goal (Delete)
- **Endpoint:** `/goal/delete`
- **Method:** DELETE
- **Body:**
```json
{
  "goal_id": "..."
}
```
- **Expect:** 200, xác nhận xóa thành công

## 5. Test nhanh bằng curl
```sh
# Tạo goal
curl -X POST http://localhost:9000/goal/create -d '{"user_id":"...","goal_name":"Mua xe máy","target_amount":20000000,"priority":"high"}' -H 'Content-Type: application/json'

# Lấy danh sách goal
curl http://localhost:9000/goal/list?user_id=...

# Cập nhật goal
curl -X PUT http://localhost:9000/goal/update -d '{"goal_id":"...","goal_name":"Mua xe mới","target_amount":25000000}' -H 'Content-Type: application/json'

# Xóa goal
curl -X DELETE http://localhost:9000/goal/delete -d '{"goal_id":"..."}' -H 'Content-Type: application/json'
``` 