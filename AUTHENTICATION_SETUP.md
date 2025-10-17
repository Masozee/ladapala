# Authentication Setup Guide

This document describes the authentication system setup for the Ladapala POS application.

## Overview

The application uses **session-based authentication** with Django's built-in session framework and CSRF protection. The authentication flow is secure and supports cross-origin requests between the Next.js frontend and Django backend.

## Backend Configuration

### Authentication Endpoints

Located at `/api/user/`:

1. **Login** - `POST /api/user/login/`
   - Request body: `{ "email": "user@example.com", "password": "password" }`
   - Returns user data, employee info, and profile info
   - Creates a session cookie

2. **Logout** - `POST /api/user/logout/`
   - Requires authentication
   - Destroys the session

3. **Check Session** - `GET /api/user/check-session/`
   - Returns current authentication status and user data
   - Used by middleware to verify active sessions

4. **Get Profile** - `GET /api/user/profile/`
   - Requires authentication
   - Returns detailed user profile information

### Settings Configuration

In `backend/core/settings.py`:

```python
# Session settings
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 86400  # 24 hours

# CSRF settings
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_COOKIE_HTTPONLY = False  # Must be False for JS to read it

# CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True  # Development only
```

## Frontend Configuration

### API Client

Located at `resto/src/lib/api.ts`:

- Automatically includes session cookies with `credentials: 'include'`
- Extracts and sends CSRF token from cookies
- Provides authentication methods:
  - `api.login(email, password)`
  - `api.logout()`
  - `api.checkSession()`
  - `api.getUserProfile()`

### Middleware

Located at `resto/middleware.ts`:

- Protects routes: `/dashboard`, `/menu`, `/meja`, `/transaksi`, `/laporan`, `/settings`, `/profile`
- Public routes: `/login`, `/register`
- Automatically redirects unauthenticated users to `/login`
- Verifies session with backend on each protected route access

### Login Page

Located at `resto/src/app/login/page.tsx`:

- Email and password authentication
- Remember me option
- Indonesian localization
- Responsive design with features showcase

### Logout Functionality

Integrated into sidebar at `resto/src/components/sidebar.tsx`:

- Calls API logout endpoint
- Redirects to login page
- Handles errors gracefully

## Testing the Authentication Flow

### 1. Create a Test User

Run the Django management command to create a superuser:

```bash
cd backend
python manage.py createsuperuser
```

Follow the prompts to enter:
- Email address
- Password (will be hidden)
- Password confirmation

Or create a regular user via Django shell:

```bash
cd backend
python manage.py shell
```

Then run:

```python
from apps.user.models import User
user = User.objects.create_user(
    email='kasir@ladapala.com',
    password='kasir123',
    first_name='Kasir',
    last_name='Satu',
    is_active=True
)
print(f"Created user: {user.email}")
```

### 2. Start the Backend Server

```bash
cd backend
python manage.py runserver
```

The backend should be running at `http://localhost:8000`

### 3. Start the Frontend Server

```bash
cd resto
bun dev
```

The frontend should be running at `http://localhost:3000`

### 4. Test Authentication

1. **Visit the frontend**: Navigate to `http://localhost:3000`
2. **Redirect to login**: Should automatically redirect to `/login`
3. **Login**: Enter credentials:
   - Email: `kasir@ladapala.com`
   - Password: `kasir123`
4. **Access protected routes**: After successful login, you should be redirected to `/dashboard`
5. **Test middleware**: Try accessing other protected routes like `/menu`, `/meja`, etc.
6. **Logout**: Click the menu button in the sidebar and select "Keluar" (Logout)
7. **Verify redirect**: Should redirect back to `/login`

### 5. Test Session Persistence

1. Login successfully
2. Refresh the page - should remain logged in
3. Close and reopen the browser - should remain logged in (if "Remember me" was checked)
4. Wait 24 hours - session should expire and redirect to login

## Security Considerations

### Development vs Production

The current configuration is for **development only**. For production:

1. Set `SESSION_COOKIE_SECURE = True`
2. Set `CSRF_COOKIE_SECURE = True`
3. Set `CORS_ALLOW_ALL_ORIGINS = False`
4. Keep only necessary origins in `CORS_ALLOWED_ORIGINS`
5. Use HTTPS for all connections
6. Change `SECRET_KEY` in settings.py
7. Set `DEBUG = False`

### CSRF Protection

- CSRF tokens are automatically managed
- The API client fetches CSRF token before login
- All POST requests include CSRF token in headers
- CSRF cookie must have `HttpOnly = False` for JavaScript access

### Session Security

- Sessions are stored server-side (SQLite in development)
- Session cookie is `HttpOnly` to prevent XSS attacks
- Session expires after 24 hours of inactivity
- Logout properly destroys the session

## Troubleshooting

### Login fails with "Invalid credentials"

- Verify user exists in database
- Check password is correct
- Ensure user is active: `user.is_active = True`

### Session not persisting

- Check browser cookies are enabled
- Verify `CORS_ALLOW_CREDENTIALS = True` in Django settings
- Ensure API client includes `credentials: 'include'`
- Check CSRF and session cookies are being set

### Middleware redirects even when logged in

- Check session cookie is being sent with requests
- Verify backend `/api/user/check-session/` endpoint returns authenticated: true
- Check middleware configuration in `resto/middleware.ts`

### CSRF verification failed

- Ensure CSRF cookie is present in browser
- Verify CSRF token is included in request headers
- Check `CSRF_COOKIE_HTTPONLY = False` in settings
- Try calling `api.getCsrfCookie()` before login

## API Examples

### Login Request

```bash
curl -X POST http://localhost:8000/api/user/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"kasir@ladapala.com","password":"kasir123"}' \
  -c cookies.txt
```

### Check Session

```bash
curl http://localhost:8000/api/user/check-session/ \
  -b cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:8000/api/user/logout/ \
  -b cookies.txt
```

## File Structure

```
backend/
├── apps/user/
│   ├── models.py          # User, Employee, UserProfile models
│   ├── views.py           # Authentication views
│   └── urls.py            # Authentication endpoints
└── core/
    └── settings.py        # Django configuration

resto/
├── src/
│   ├── app/
│   │   └── login/
│   │       └── page.tsx   # Login page
│   ├── components/
│   │   └── sidebar.tsx    # Logout functionality
│   └── lib/
│       └── api.ts         # API client with auth methods
└── middleware.ts          # Authentication middleware
```

## Next Steps

- [ ] Add password reset functionality
- [ ] Implement remember me functionality
- [ ] Add user registration (if needed)
- [ ] Add role-based access control
- [ ] Implement refresh token mechanism
- [ ] Add multi-factor authentication
- [ ] Set up production deployment with HTTPS
