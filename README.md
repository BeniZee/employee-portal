# Employee Portal

A full-stack employee portal application with React frontend and Express backend.

## Features

- Employee registration and authentication
- Profile management with photo upload
- Timesheet tracking (clock in/out)
- Protected routes and JWT authentication
- PostgreSQL database integration

## Project Structure

```
employee-portal/
├── client/     → React frontend
├── backend/    → Express backend
```

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   DB_USER=your_db_user
   DB_HOST=your_db_host
   DB_NAME=employee_portal
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret_key
   ```

4. Create the database tables:
   ```sql
   -- employees
   CREATE TABLE employees (
     id SERIAL PRIMARY KEY,
     first_name VARCHAR(50),
     last_name VARCHAR(50),
     employee_id VARCHAR(20) UNIQUE,
     email VARCHAR(100) UNIQUE,
     password_hash TEXT,
     profile_photo TEXT
   );

   -- time_entries
   CREATE TABLE time_entries (
     id SERIAL PRIMARY KEY,
     employee_id INT REFERENCES employees(id),
     clock_in TIMESTAMP,
     clock_out TIMESTAMP,
     date DATE DEFAULT CURRENT_DATE
   );
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- POST /api/register - Register a new employee
- POST /api/login - Login employee
- GET /api/profile - Get employee profile

### Timesheet
- POST /api/timesheet/clock-in - Clock in
- POST /api/timesheet/clock-out - Clock out
- GET /api/timesheet - Get timesheet entries

## Security

- Passwords are hashed using bcrypt
- JWT authentication for protected routes
- CORS enabled for frontend-backend communication
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 