# Testing Guide

## Manual Testing Checklist

### Authentication Flow
- [ ] User Registration
  - [ ] Valid registration with all required fields
  - [ ] Duplicate email/employee ID handling
  - [ ] Password validation (min 8 chars)
  - [ ] Profile photo upload

- [ ] Login Process
  - [ ] Valid credentials
  - [ ] Invalid credentials
  - [ ] Rate limiting after failed attempts
  - [ ] Remember device functionality

- [ ] 2FA Verification
  - [ ] OTP delivery via email
  - [ ] OTP expiration (5 minutes)
  - [ ] Invalid OTP handling
  - [ ] Resend OTP functionality
  - [ ] Rate limiting for OTP requests

- [ ] Password Reset
  - [ ] Request reset link
  - [ ] Reset link expiration (1 hour)
  - [ ] Password update
  - [ ] Invalid/expired token handling

### Timesheet Features
- [ ] Time Entry
  - [ ] Clock in/out
  - [ ] Break time calculation
  - [ ] Total hours calculation
  - [ ] Date validation

- [ ] Admin Dashboard
  - [ ] View all timesheets
  - [ ] Filter by date range
  - [ ] Filter by employee
  - [ ] Sort by different columns
  - [ ] Pagination
  - [ ] CSV export

### Device Management
- [ ] Remember Device
  - [ ] Device token generation
  - [ ] Skip 2FA for remembered devices
  - [ ] Device list management
  - [ ] Remove individual devices
  - [ ] Remove all devices

## Test Accounts

### Admin User
```
Email: admin@example.com
Password: Admin@123
```

### Regular Employee
```
Email: employee@example.com
Password: Employee@123
```

## API Testing

### Authentication Endpoints
```bash
# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'

# Verify OTP
curl -X POST http://localhost:5000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"tempToken":"your-temp-token","otp":"123456"}'

# Password Reset
curl -X POST http://localhost:5000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'
```

### Timesheet Endpoints
```bash
# Get Timesheets (Admin)
curl -X GET http://localhost:5000/api/admin/timesheets \
  -H "Authorization: Bearer your-token"

# Export CSV
curl -X GET http://localhost:5000/api/admin/timesheets/export \
  -H "Authorization: Bearer your-token"
```

## Security Testing

### Rate Limiting
- Test login attempts (max 5 per 10 minutes)
- Test OTP requests (max 3 per 10 minutes)
- Test password reset requests (max 3 per hour)

### Cookie Security
- Verify httpOnly flag
- Verify secure flag in production
- Verify sameSite policy

### CORS
- Test cross-origin requests
- Verify allowed origins
- Test credentials handling

## Performance Testing

### Load Testing
- Test with 100 concurrent users
- Monitor response times
- Check database connection pool
- Verify memory usage

### Export Performance
- Test CSV export with 1000+ records
- Monitor memory usage during export
- Verify download speed

## Browser Testing

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing
- iOS Safari
- Android Chrome
- Responsive design verification

## Error Handling

### Expected Errors
- Invalid credentials
- Expired OTP
- Invalid reset token
- Rate limit exceeded
- Network errors

### Error Messages
- Verify user-friendly messages
- Check error logging
- Test error recovery flows 