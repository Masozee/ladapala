# Authentication 401 Error Fix

## Problem
The profile page (`/profile`) is getting 401 Unauthorized errors for `/api/user/profile/` and `/api/user/shifts/` endpoints because session cookies aren't being properly set or sent.

## Root Cause
The Django session cookie settings were using `SameSite='None'` without `Secure=True`, which doesn't work in local development over HTTP. Browsers require `Secure=True` when using `SameSite='None'`.

## Fix Applied

### 1. Updated Django Settings (`backend/core/settings.py`)

Changed session and CSRF cookie settings:

```python
# Session and CSRF settings for cross-origin authentication
SESSION_COOKIE_SAMESITE = 'Lax'  # Changed from 'None' to 'Lax' for local development
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_DOMAIN = None  # Allow cookies to work on localhost

CSRF_COOKIE_SAMESITE = 'Lax'  # Changed from 'None' to 'Lax' for local development
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_COOKIE_HTTPONLY = False  # Must be False for JS to read it
CSRF_COOKIE_DOMAIN = None  # Allow cookies to work on localhost
```

## Testing Steps

### 1. Restart Django Backend
```bash
cd backend

# Kill any running Django processes
pkill -f "python manage.py runserver"

# Start Django backend
python manage.py runserver
```

### 2. Create Test Users (if not already done)
```bash
cd backend
python manage.py seed_auth_users
```

This creates test users:
- **admin@resto.com** / password: **admin123**
- **manager@resto.com** / password: **manager123**
- **cashier@resto.com** / password: **cashier123**

### 3. Start Frontend
```bash
cd resto
bun dev
```

### 4. Test Authentication Flow

1. **Clear browser cookies and cache** for `localhost:3000`
2. Navigate to http://localhost:3000
3. You should be redirected to `/login`
4. Login with: `admin@resto.com` / `admin123`
5. After login, navigate to http://localhost:3000/profile
6. **Check browser DevTools**:
   - Network tab: Verify cookies are being sent with requests
   - Application/Storage tab: Check if `sessionid` and `csrftoken` cookies exist

### 5. Verify API Calls

Open Browser DevTools → Network tab and check:

1. **Login request** (`POST /api/user/login/`):
   - Response should set `sessionid` and `csrftoken` cookies
   - Status: 200 OK

2. **Profile request** (`GET /api/user/profile/`):
   - Should include `Cookie` header with `sessionid`
   - Should include `X-CSRFToken` header
   - Status: 200 OK (not 401)

3. **Shifts request** (`GET /api/user/shifts/`):
   - Should include `Cookie` header with `sessionid`
   - Status: 200 OK (not 401)

## Troubleshooting

### If still getting 401 errors:

1. **Check if cookies are being set after login:**
   - Open DevTools → Application → Cookies → `http://localhost:3000`
   - Verify `sessionid` cookie exists
   - Note: Cookies might be at `localhost:8000` or `localhost:3000` depending on configuration

2. **Verify CORS is working:**
   ```bash
   curl -v -H "Origin: http://localhost:3000" http://localhost:8000/api/user/check-session/
   ```
   Should include `Access-Control-Allow-Origin: http://localhost:3000` in response headers

3. **Test login directly:**
   ```bash
   # Get CSRF token
   curl -c cookies.txt http://localhost:8000/api/user/login/

   # Extract token and login
   CSRF=$(grep csrftoken cookies.txt | awk '{print $7}')
   curl -b cookies.txt -c cookies.txt \
     -X POST http://localhost:8000/api/user/login/ \
     -H "Content-Type: application/json" \
     -H "X-CSRFToken: $CSRF" \
     -d '{"email":"admin@resto.com","password":"admin123"}'

   # Test authenticated request
   CSRF=$(grep csrftoken cookies.txt | awk '{print $7}')
   curl -b cookies.txt \
     -H "X-CSRFToken: $CSRF" \
     http://localhost:8000/api/user/profile/
   ```

4. **Check Django logs:**
   - Look for authentication errors in Django console
   - Check for CSRF failures

5. **Browser cache:**
   - Try incognito/private browsing mode
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

### Common Issues:

1. **SameSite Cookie Issue**: Fixed by changing to `'Lax'` for local dev
2. **CORS not allowing credentials**: Fixed with `CORS_ALLOW_CREDENTIALS = True`
3. **Wrong cookie domain**: Fixed by setting `SESSION_COOKIE_DOMAIN = None`
4. **Frontend not sending cookies**: Verify `credentials: 'include'` in fetch calls

## Production Notes

For production deployment with HTTPS:

```python
# Production settings
SESSION_COOKIE_SAMESITE = 'None'  # Can use 'None' with Secure=True
SESSION_COOKIE_SECURE = True  # Required for HTTPS
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True

# Update trusted origins to use https://
CSRF_TRUSTED_ORIGINS = [
    "https://yourdomain.com",
]

CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
]
```

## Files Modified

1. `/backend/core/settings.py` - Updated session and CSRF cookie settings
2. `/backend/apps/user/views.py` - Added `csrf_exempt` import (not used yet)

## Next Steps

If the issue persists after these changes:
1. Check if the frontend is sending cookies with requests (`credentials: 'include'`)
2. Verify the API client in `resto/src/lib/api.ts` has correct configuration
3. Test with browser DevTools Network tab to see exact headers being sent/received
