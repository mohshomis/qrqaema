# API Documentation

This document provides detailed information about the Restaurant Order System's API endpoints.

## Authentication

The API uses JWT (JSON Web Token) authentication.

### Authentication Endpoints

#### Login
```http
POST /api/auth/login/
```
Request:
```json
{
  "username": "string",
  "password": "string"
}
```
Response:
```json
{
  "access": "string",
  "refresh": "string",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string"
  }
}
```

#### Register
```http
POST /api/auth/register/
```
Request:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "restaurant": {
    "name": "string",
    "address": "string",
    "phone_number": "string"
  }
}
```

#### Refresh Token
```http
POST /api/auth/token/refresh/
```
Request:
```json
{
  "refresh": "string"
}
```
Response:
```json
{
  "access": "string"
}
```

## Restaurant Management

### Restaurant Profile

#### Get Restaurant Profile
```http
GET /api/restaurants/{restaurant_id}/
```
Response:
```json
{
  "id": "uuid",
  "name": "string",
  "address": "string",
  "phone_number": "string",
  "logo": "url",
  "background_image": "url",
  "country": "string",
  "city": "string",
  "postal_code": "string",
  "currency": "string",
  "number_of_employees": "integer",
  "profile_completed": "boolean"
}
```

#### Update Restaurant Profile
```http
PATCH /api/restaurants/{restaurant_id}/
```
Request:
```json
{
  "name": "string",
  "address": "string",
  "phone_number": "string",
  "logo": "file",
  "background_image": "file",
  "country": "string",
  "city": "string",
  "postal_code": "string",
  "currency": "string",
  "number_of_employees": "integer"
}
```

### Menu Management

#### List Categories
```http
GET /api/restaurants/{restaurant_id}/menus/{menu_id}/categories/
```
Response:
```json
[
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "image": "url",
    "order": "integer"
  }
]
```

#### Create Category
```http
POST /api/restaurants/{restaurant_id}/menus/{menu_id}/categories/
```
Request:
```json
{
  "name": "string",
  "description": "string",
  "image": "file",
  "order": "integer"
}
```

#### List Menu Items
```http
GET /api/restaurants/{restaurant_id}/menus/{menu_id}/categories/{category_id}/items/
```
Response:
```json
[
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "price": "decimal",
    "image": "url",
    "is_available": "boolean",
    "order": "integer",
    "options": [
      {
        "id": "integer",
        "name": "string",
        "choices": [
          {
            "id": "integer",
            "name": "string",
            "price_modifier": "decimal"
          }
        ]
      }
    ]
  }
]
```

#### Create Menu Item
```http
POST /api/restaurants/{restaurant_id}/menus/{menu_id}/categories/{category_id}/items/
```
Request:
```json
{
  "name": "string",
  "description": "string",
  "price": "decimal",
  "image": "file",
  "is_available": "boolean",
  "order": "integer",
  "options": [
    {
      "name": "string",
      "choices": [
        {
          "name": "string",
          "price_modifier": "decimal"
        }
      ]
    }
  ]
}
```

### Table Management

#### List Tables
```http
GET /api/restaurants/{restaurant_id}/tables/
```
Response:
```json
[
  {
    "id": "uuid",
    "number": "integer",
    "status": "string",
    "capacity": "integer",
    "qr_code_url": "url"
  }
]
```

#### Create Table
```http
POST /api/restaurants/{restaurant_id}/tables/
```
Request:
```json
{
  "number": "integer",
  "capacity": "integer"
}
```

### Order Management

#### List Orders
```http
GET /api/restaurants/{restaurant_id}/orders/
```
Query Parameters:
- status: "Pending" | "In Progress" | "Completed"
- table_id: UUID
- date: YYYY-MM-DD

Response:
```json
[
  {
    "id": "uuid",
    "table": {
      "id": "uuid",
      "number": "integer"
    },
    "items": [
      {
        "menu_item": {
          "id": "integer",
          "name": "string",
          "price": "decimal"
        },
        "quantity": "integer",
        "special_request": "string",
        "selected_options": [
          {
            "id": "integer",
            "name": "string",
            "price_modifier": "decimal"
          }
        ],
        "total_price": "decimal"
      }
    ],
    "status": "string",
    "created_at": "datetime",
    "additional_info": "string"
  }
]
```

#### Create Order
```http
POST /api/restaurants/{restaurant_id}/orders/
```
Request:
```json
{
  "table_id": "uuid",
  "items": [
    {
      "menu_item_id": "integer",
      "quantity": "integer",
      "special_request": "string",
      "selected_options": ["integer"]
    }
  ],
  "additional_info": "string"
}
```

#### Update Order Status
```http
PATCH /api/restaurants/{restaurant_id}/orders/{order_id}/
```
Request:
```json
{
  "status": "string"
}
```

### Help Requests

#### List Help Requests
```http
GET /api/restaurants/{restaurant_id}/help-requests/
```
Response:
```json
[
  {
    "id": "integer",
    "table": {
      "id": "uuid",
      "number": "integer"
    },
    "description": "string",
    "status": "string",
    "response": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
]
```

#### Create Help Request
```http
POST /api/restaurants/{restaurant_id}/help-requests/
```
Request:
```json
{
  "table_id": "uuid",
  "description": "string"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "string",
  "details": {}
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error occurred."
}
```

## Rate Limiting

The API implements rate limiting based on user type:
- Anonymous users: 100 requests per day
- Authenticated users: 1000 requests per day

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following query parameters:
- page: Page number (default: 1)
- page_size: Number of items per page (default: 10, max: 100)

Response format for paginated endpoints:
```json
{
  "count": "integer",
  "next": "url",
  "previous": "url",
  "results": []
}
```

## Filtering and Sorting

Many list endpoints support filtering and sorting:

### Filtering
Add query parameters matching model fields:
```http
GET /api/restaurants/{restaurant_id}/orders/?status=Pending&created_at__gte=2025-01-01
```

### Sorting
Use the `ordering` parameter:
```http
GET /api/restaurants/{restaurant_id}/menu-items/?ordering=-created_at
```

## WebSocket Endpoints

### Order Updates
```
ws://domain/ws/restaurants/{restaurant_id}/orders/
```

Message format:
```json
{
  "type": "order_update",
  "data": {
    "order_id": "uuid",
    "status": "string",
    "updated_at": "datetime"
  }
}
```

### Table Status Updates
```
ws://domain/ws/restaurants/{restaurant_id}/tables/
```

Message format:
```json
{
  "type": "table_update",
  "data": {
    "table_id": "uuid",
    "status": "string",
    "updated_at": "datetime"
  }
}
```

## API Versioning

The API version is specified in the URL:
```http
/api/v1/...
```

Current stable version: v1

## Best Practices

1. Always include the Authorization header:
```http
Authorization: Bearer <access_token>
```

2. Handle rate limiting by checking response headers

3. Implement proper error handling for all possible response codes

4. Use appropriate HTTP methods:
- GET for retrieving data
- POST for creating new resources
- PATCH for partial updates
- PUT for full updates
- DELETE for removing resources

5. Include proper content-type headers:
```http
Content-Type: application/json
```

## Testing the API

Use the provided Postman collection:
```
/docs/postman/restaurant-order-system.postman_collection.json
```

Or use curl examples:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Create Order
curl -X POST http://localhost:8000/api/restaurants/{restaurant_id}/orders/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": "uuid",
    "items": [{
      "menu_item_id": 1,
      "quantity": 2
    }]
  }'
