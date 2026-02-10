# WebHarbour - API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
Include JWT token in headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "isModerator": false
  }
}
```

---

### Get Current User
```http
GET /auth/me
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john@example.com",
  "profileImage": "https://...",
  "bio": "Software developer",
  "isModerator": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Product Endpoints

### Get All Products
```http
GET /products?page=1&limit=12&category=app&search=calculator
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `category` (optional): Filter by category (app, game, software, pdf, movie)
- `search` (optional): Search by title, description, or tags

**Response (200):**
```json
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Calculator App",
      "description": "A simple calculator for daily use",
      "category": "app",
      "developer": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "john_doe",
        "profileImage": "https://..."
      },
      "price": 2.99,
      "rating": 4.5,
      "thumbnail": "https://...",
      "downloads": 150,
      "status": "approved",
      "tags": ["calculator", "math", "utility"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 245,
  "pages": 21,
  "currentPage": 1
}
```

---

### Get Single Product
```http
GET /products/507f1f77bcf86cd799439011
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Calculator App",
  "description": "A simple calculator for daily use",
  "category": "app",
  "developer": {
    "_id": "507f1f77bcf86cd799439012",
    "username": "john_doe",
    "profileImage": "https://...",
    "bio": "Software developer"
  },
  "price": 2.99,
  "rating": 4.5,
  "thumbnail": "https://...",
  "fileUrl": "https://...",
  "downloads": 150,
  "status": "approved",
  "tags": ["calculator", "math"],
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "user": {
        "_id": "507f1f77bcf86cd799439014",
        "username": "jane_smith",
        "profileImage": "https://..."
      },
      "rating": 5,
      "comment": "Great app! Very useful.",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Upload Product
```http
POST /products/upload
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "My Calculator",
  "description": "A powerful scientific calculator",
  "category": "app",
  "price": 4.99,
  "thumbnail": "https://example.com/image.jpg",
  "fileUrl": "https://example.com/calculator.zip",
  "tags": ["calculator", "math", "science"]
}
```

**Response (201):**
```json
{
  "message": "Product uploaded for review",
  "product": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "My Calculator",
    "status": "pending",
    "developer": "507f1f77bcf86cd799439011"
  }
}
```

---

### Get User's Products
```http
GET /user/products
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My Calculator",
    "price": 4.99,
    "status": "approved",
    "downloads": 50,
    "rating": 4.8,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## Review Endpoints

### Add Review
```http
POST /reviews
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "comment": "This is an amazing product! Highly recommended."
}
```

**Response (201):**
```json
{
  "message": "Review added",
  "review": {
    "_id": "507f1f77bcf86cd799439016",
    "product": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "rating": 5,
    "comment": "This is an amazing product! Highly recommended.",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get Product Reviews
```http
GET /reviews/507f1f77bcf86cd799439011
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "jane_smith",
      "profileImage": "https://..."
    },
    "rating": 5,
    "comment": "Amazing product!",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## Purchase Endpoints

### Create Purchase
```http
POST /purchases
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011"
}
```

**Response (201):**
```json
{
  "message": "Purchase successful",
  "purchase": {
    "_id": "507f1f77bcf86cd799439017",
    "user": "507f1f77bcf86cd799439012",
    "product": "507f1f77bcf86cd799439011",
    "price": 4.99,
    "transactionId": "TXN_1705324200000_abc123",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "downloadUrl": "https://example.com/download/file.zip"
}
```

---

### Get User Purchases
```http
GET /purchases
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439017",
    "user": "507f1f77bcf86cd799439012",
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "My Calculator",
      "thumbnail": "https://...",
      "fileUrl": "https://..."
    },
    "price": 4.99,
    "transactionId": "TXN_1705324200000_abc123",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## Admin Endpoints

### Get Pending Products
```http
GET /admin/pending
Authorization: Bearer MODERATOR_TOKEN
```

**Note:** User must have `isModerator: true`

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439018",
    "title": "Pending Product",
    "description": "...",
    "category": "software",
    "developer": {
      "_id": "507f1f77bcf86cd799439019",
      "username": "developer",
      "email": "dev@example.com"
    },
    "price": 9.99,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Review Product
```http
POST /admin/products/507f1f77bcf86cd799439018/review
Authorization: Bearer MODERATOR_TOKEN
Content-Type: application/json

{
  "status": "approved"
}
```

Or to reject:
```json
{
  "status": "rejected",
  "rejectionReason": "Contains copyrighted material"
}
```

**Response (200):**
```json
{
  "message": "Product reviewed",
  "product": {
    "_id": "507f1f77bcf86cd799439018",
    "title": "Pending Product",
    "status": "approved",
    "rejectionReason": ""
  }
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "message": "All fields required"
}
```

### 401 - Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 - Forbidden
```json
{
  "message": "Unauthorized"
}
```

### 404 - Not Found
```json
{
  "message": "Product not found"
}
```

### 500 - Server Error
```json
{
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Token missing/invalid |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

---

## Testing with Postman

### 1. Import Collection
Copy the API endpoints to Postman collection

### 2. Set Variables
```
BASE_URL = http://localhost:5000/api
TOKEN = (obtained from login)
PRODUCT_ID = (from products list)
```

### 3. Test Flow
1. Register → Get TOKEN
2. Login → Verify TOKEN
3. Get Products
4. Get Single Product
5. Upload Product
6. Add Review
7. Create Purchase
8. Get Purchases

---

## Rate Limiting (Future)

When implemented:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1705330800
```

---

## Pagination

Products endpoint supports pagination:
```
GET /products?page=2&limit=12
```

Response includes:
```json
{
  "products": [...],
  "total": 245,
  "pages": 21,
  "currentPage": 2
}
```

---

## Search

Search across multiple fields:
```
GET /products?search=calculator
```

Searches in:
- Product title
- Product description
- Product tags

---

## Filtering

Filter by single category:
```
GET /products?category=app
```

Valid categories:
- app
- game
- software
- pdf
- movie

---

## Combining Filters

```
GET /products?search=calculator&category=app&page=1&limit=12
```

---

## Authentication Token Format

JWT tokens contain:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1705324200,
  "exp": 1705928200
}
```

Token expires in 7 days.

---

## Example JavaScript Fetch Calls

### Login
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'pass' })
});
const data = await response.json();
localStorage.setItem('token', data.token);
```

### Get Products
```javascript
const response = await fetch('http://localhost:5000/api/products?page=1');
const data = await response.json();
console.log(data.products);
```

### Protected Request
```javascript
const response = await fetch('http://localhost:5000/api/user/products', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
const products = await response.json();
```

---

## API Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "message": "WebHarbour API is running"
}
```

---

## More Help

- See `ADMIN_GUIDE.md` for moderator operations
- See `FEATURES.md` for feature overview
- See `SETUP_GUIDE.md` for deployment help
- Check `backend/server.js` for implementation details

---

*Last Updated: January 2024*
