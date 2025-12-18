# Backend API Server

Express + MongoDB backend for Telegram Bot Admin Panel.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bot_admin
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000
```

3. Make sure MongoDB is running on your system.

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000` by default.

## Initialize Admin

Create an admin account (run once):
```bash
curl -X POST http://localhost:5000/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

## API Endpoints

### Authentication
- `POST /api/auth/init` - Initialize admin account (one-time setup)
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/change-password` - Change admin password (requires auth)

### Status (for bot)
- `POST /api/getstatus` - Get user access status by telegram id (no auth)

### Users
- `GET /api/users` - Get all users (requires auth)
- `POST /api/users` - Create new user (requires auth)
- `GET /api/users/:id` - Get single user (requires auth)
- `PATCH /api/users/:id` - Update user expireDate and/or force status (requires auth)
- `DELETE /api/users/:id` - Delete user (requires auth)

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Date Handling**: date-fns

