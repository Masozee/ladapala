# Deployment Guide - Ladapala System

Guide untuk deploy sistem Ladapala (Hotel + Restaurant) ke server production.

## Requirements

- Python 3.12 atau lebih tinggi
- Node.js 18+ dan npm
- SQLite (sudah termasuk di Python)
- Web server (Nginx/Apache)

## 1. Backend Deployment (Django)

### Hotel Backend

```bash
# Clone repository
git clone <your-repo-url>
cd ladapala/hotel/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# atau
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate
python manage.py seed_hotel_users
python manage.py seed_hotel_data

# Collect static files (untuk production)
python manage.py collectstatic --noinput

# Run server (development)
python manage.py runserver 0.0.0.0:8000

# Run server (production - gunakan gunicorn)
pip install gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Restaurant Backend

```bash
cd ladapala/resto/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate
python manage.py seed_auth_users
python manage.py seed_resto_data

# Collect static files
python manage.py collectstatic --noinput

# Run server (production)
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

## 2. Frontend Deployment (Next.js)

### Hotel Frontend

```bash
cd ladapala/hotel/frontend

# Install dependencies
npm install

# Update environment variables
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://your-server-ip:8000/api
NEXT_PUBLIC_HOTEL_API_URL=http://your-server-ip:8000/api/hotel
EOF

# Build for production
npm run build

# Run production server
npm start
# atau dengan PM2
npm install -g pm2
pm2 start npm --name "hotel-frontend" -- start
```

### Restaurant Frontend

```bash
cd ladapala/resto/frontend

# Install dependencies
npm install

# Update environment variables
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://your-server-ip:8000/api
NEXT_PUBLIC_API_BRANCH_ID=4
EOF

# Build for production
npm run build

# Run production server
npm start
# atau dengan PM2
pm2 start npm --name "resto-frontend" -- start
```

## 3. Production Configuration

### Django Settings

Update `settings.py` untuk production:

```python
# hotel/backend/core/settings.py atau resto/backend/core/settings.py

DEBUG = False

ALLOWED_HOSTS = ['your-domain.com', 'your-server-ip']

# Database (optional - switch to PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ladapala_hotel',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Static files
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

# Media files
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### Nginx Configuration

```nginx
# Hotel System
server {
    listen 80;
    server_name hotel.yourdomain.com;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        alias /path/to/hotel/backend/staticfiles/;
    }

    location /media/ {
        alias /path/to/hotel/backend/media/;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Restaurant System
server {
    listen 80;
    server_name resto.yourdomain.com;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 4. Process Management with Systemd

### Hotel Backend Service

```bash
sudo nano /etc/systemd/system/hotel-backend.service
```

```ini
[Unit]
Description=Hotel Backend (Django)
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/ladapala/hotel/backend
Environment="PATH=/path/to/ladapala/hotel/backend/venv/bin"
ExecStart=/path/to/ladapala/hotel/backend/venv/bin/gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

### Hotel Frontend Service

```bash
sudo nano /etc/systemd/system/hotel-frontend.service
```

```ini
[Unit]
Description=Hotel Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ladapala/hotel/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
sudo systemctl enable hotel-backend
sudo systemctl enable hotel-frontend
sudo systemctl start hotel-backend
sudo systemctl start hotel-frontend

# Check status
sudo systemctl status hotel-backend
sudo systemctl status hotel-frontend
```

## 5. Quick Deploy Commands

### Install semua dependencies

```bash
# Hotel Backend
cd hotel/backend && pip install -r requirements.txt

# Resto Backend
cd resto/backend && pip install -r requirements.txt

# Hotel Frontend
cd hotel/frontend && npm install

# Resto Frontend
cd resto/frontend && npm install
```

### Database Setup

```bash
# Hotel
cd hotel/backend
python manage.py migrate
python manage.py seed_hotel_users
python manage.py seed_hotel_data

# Resto
cd resto/backend
python manage.py migrate
python manage.py seed_auth_users
python manage.py seed_resto_data
```

### Build Frontends

```bash
cd hotel/frontend && npm run build
cd resto/frontend && npm run build
```

## 6. Ports Configuration

- Hotel Backend: Port 8000
- Hotel Frontend: Port 3000
- Resto Backend: Port 8000 (jika hotel tidak running)
- Resto Frontend: Port 3000

**Note**: Hanya satu backend yang bisa run di port 8000. Jika ingin run bersamaan, ubah port salah satu backend.

## 7. Common Issues

### Port already in use

```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Static files not loading

```bash
python manage.py collectstatic --noinput
```

### Database errors

```bash
# Reset database
rm db.sqlite3
python manage.py migrate
python manage.py seed_hotel_users
```

## 8. Monitoring

```bash
# Check logs
tail -f /var/log/nginx/error.log
journalctl -u hotel-backend -f
journalctl -u hotel-frontend -f

# Check running processes
ps aux | grep gunicorn
ps aux | grep node
```

## Support

Untuk deployment assistance, hubungi tim development.
