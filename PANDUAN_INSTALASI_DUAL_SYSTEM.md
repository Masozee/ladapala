# PANDUAN INSTALASI HOTELBASE & RESTO
## Instalasi 2 Sistem dalam 1 Server dengan Domain Berbeda

---

## Gambaran Umum

Panduan ini akan membantu Anda menginstall **HotelBase** dan **Resto** dalam satu server fisik dengan konfigurasi domain terpisah menggunakan nginx sebagai reverse proxy.

### Arsitektur Sistem

```
Server (IP: 192.168.1.100)
    ↓
nginx (Port 80/443) - Reverse Proxy
    ↓                           ↓
hotel.example.com           resto.example.com
    ↓                           ↓
HotelBase                   Resto
Frontend: 3001              Frontend: 3000
Backend: 8001               Backend: 8000
```

---

## Persyaratan Sistem

### Hardware
- **OS**: Windows 10/11 (64-bit) atau Linux (Ubuntu 20.04+)
- **RAM**: Minimal 8GB (Disarankan 16GB untuk 2 sistem)
- **Storage**: 5GB ruang kosong
- **Processor**: Dual-core atau lebih tinggi

### Software
- **Node.js**: v20.11.0 atau lebih baru
- **Python**: v3.11.0 atau lebih baru
- **nginx**: v1.24 atau lebih baru
- **PM2**: Process Manager (akan diinstall otomatis)

### Port yang Dibutuhkan
- **80** (HTTP) - nginx reverse proxy
- **443** (HTTPS - opsional) - nginx SSL
- **3000** - Resto Frontend
- **3001** - HotelBase Frontend
- **8000** - Resto Backend
- **8001** - HotelBase Backend

### Domain/Subdomain
- **HotelBase**: `hotel.example.com` (atau `192.168.1.100/hotel`)
- **Resto**: `resto.example.com` (atau `192.168.1.100/resto`)

---

## Struktur Direktori

```
/var/www/ladapala/  (Linux)
atau
C:\ladapala\        (Windows)
│
├── hotelbase/
│   ├── backend/              # Django Backend (Port 8001)
│   │   ├── .venv/
│   │   ├── manage.py
│   │   ├── .env
│   │   └── db.sqlite3
│   └── frontend/             # Next.js Frontend (Port 3001)
│       ├── .next/
│       ├── .env.local
│       └── package.json
│
├── resto/
│   ├── backend/              # Django Backend (Port 8000)
│   │   ├── .venv/
│   │   ├── manage.py
│   │   ├── .env
│   │   └── db.sqlite3
│   └── frontend/             # Next.js Frontend (Port 3000)
│       ├── .next/
│       ├── .env.local
│       └── package.json
│
├── nginx/
│   └── nginx.conf           # Konfigurasi nginx
│
├── logs/
│   ├── hotelbase/
│   └── resto/
│
├── ecosystem.config.js      # PM2 configuration
├── START_ALL.bat            # Jalankan semua service
├── STOP_ALL.bat             # Stop semua service
└── STATUS.bat               # Cek status service

```

---

## LANGKAH 1: Persiapan Server

### A. Install Dependencies (Windows)

#### 1. Install Node.js
```bash
# Download dari https://nodejs.org/
# Pilih: Windows Installer (.msi) 64-bit
# Install dengan default settings
# Centang "Add to PATH"
```

#### 2. Install Python
```bash
# Download dari https://www.python.org/downloads/
# Pilih: Windows installer (64-bit)
# PENTING: Centang "Add Python to PATH"
# Install dengan default settings
```

#### 3. Install nginx
```bash
# Download dari https://nginx.org/en/download.html
# Extract ke C:\nginx\
```

#### 4. Install PM2
```bash
npm install -g pm2
npm install -g pm2-windows-service
```

### B. Install Dependencies (Linux - Ubuntu)

```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3 python3-pip python3-venv

# Install nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Start nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## LANGKAH 2: Setup Resto System

### A. Backend Resto (Port 8000)

```bash
cd /var/www/ladapala/resto/backend  # Linux
# atau
cd C:\ladapala\resto\backend        # Windows

# Buat virtual environment
python -m venv .venv

# Aktivasi virtual environment
# Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Konfigurasi .env file
```

**File: `resto/backend/.env`**
```bash
# Database
DATABASE_NAME=db.sqlite3

# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100,resto.example.com

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100,http://resto.example.com,https://resto.example.com

# Branch Configuration
BRANCH_ID=7

# Server
PORT=8000
```

```bash
# Migrasi database
python manage.py migrate

# Buat superuser (admin)
python manage.py createsuperuser

# Seed data awal (opsional)
python manage.py seed_resto_data

# Test server
python manage.py runserver 0.0.0.0:8000
# Ctrl+C untuk stop
```

### B. Frontend Resto (Port 3000)

```bash
cd /var/www/ladapala/resto/frontend  # Linux
# atau
cd C:\ladapala\resto\frontend        # Windows

# Install dependencies
npm install

# Konfigurasi .env.local
```

**File: `resto/frontend/.env.local`**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://resto.example.com/api
# Atau gunakan IP jika tidak ada domain:
# NEXT_PUBLIC_API_URL=http://192.168.1.100/api/resto

# Branch Configuration
NEXT_PUBLIC_BRANCH_ID=7

# Environment
NODE_ENV=production
PORT=3000
```

```bash
# Build production
npm run build

# Test server
npm run start
# Ctrl+C untuk stop
```

---

## LANGKAH 3: Setup HotelBase System

### A. Backend HotelBase (Port 8001)

```bash
cd /var/www/ladapala/hotelbase/backend  # Linux
# atau
cd C:\ladapala\hotelbase\backend        # Windows

# Buat virtual environment
python -m venv .venv

# Aktivasi virtual environment
# Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies (menggunakan uv)
pip install uv
uv sync

# Konfigurasi .env file
```

**File: `hotelbase/backend/.env`**
```bash
# Database
DATABASE_NAME=db.sqlite3

# Django Settings
DEBUG=False
SECRET_KEY=your-hotel-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100,hotel.example.com

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://192.168.1.100,http://hotel.example.com,https://hotel.example.com

# License Key (pilih salah satu dari 16 valid keys)
LICENSE_KEY=KL-U384T

# Server
PORT=8001
```

```bash
# Migrasi database
uv run python manage.py migrate

# Buat superuser (admin)
uv run python manage.py createsuperuser

# Seed data awal hotel (opsional)
uv run python manage.py seed_hotel_data

# Test server
uv run python manage.py runserver 0.0.0.0:8001
# Ctrl+C untuk stop
```

### B. Frontend HotelBase (Port 3001)

```bash
cd /var/www/ladapala/hotelbase/frontend  # Linux
# atau
cd C:\ladapala\hotelbase\frontend        # Windows

# Install dependencies
npm install

# Konfigurasi .env.local
```

**File: `hotelbase/frontend/.env.local`**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://hotel.example.com/api
# Atau gunakan IP jika tidak ada domain:
# NEXT_PUBLIC_API_URL=http://192.168.1.100/api/hotel

# License Key (HARUS SAMA dengan backend!)
NEXT_PUBLIC_LICENSE_KEY=KL-U384T

# Environment
NODE_ENV=production
PORT=3001
```

```bash
# Build production
npm run build

# Test server
npm run start
# Ctrl+C untuk stop
```

---

## LANGKAH 4: Konfigurasi nginx

### A. Konfigurasi nginx untuk Dual System

**File: `nginx/nginx.conf` (Windows: `C:\nginx\conf\nginx.conf`)**

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # RESTO - Subdomain/Domain
    server {
        listen 80;
        server_name resto.example.com;  # Ganti dengan domain Anda

        # Frontend Resto
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API Resto
        location /api/ {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Django Admin Resto
        location /admin/ {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Django Static Files
        location /static/ {
            proxy_pass http://localhost:8000;
        }

        # Django Media Files
        location /media/ {
            proxy_pass http://localhost:8000;
        }
    }

    # HOTELBASE - Subdomain/Domain
    server {
        listen 80;
        server_name hotel.example.com;  # Ganti dengan domain Anda

        # Frontend HotelBase
        location / {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API HotelBase
        location /api/ {
            proxy_pass http://localhost:8001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Django Admin HotelBase
        location /admin/ {
            proxy_pass http://localhost:8001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Django Static Files
        location /static/ {
            proxy_pass http://localhost:8001;
        }

        # Django Media Files
        location /media/ {
            proxy_pass http://localhost:8001;
        }
    }

    # ALTERNATIF: Menggunakan IP dengan Path-based Routing
    # Jika tidak punya domain, gunakan konfigurasi ini
    server {
        listen 80;
        server_name 192.168.1.100;  # IP Server Anda

        # Resto System
        location /resto {
            rewrite ^/resto(.*)$ $1 break;
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/resto {
            rewrite ^/api/resto(.*)$ /api$1 break;
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
        }

        # HotelBase System
        location /hotel {
            rewrite ^/hotel(.*)$ $1 break;
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/hotel {
            rewrite ^/api/hotel(.*)$ /api$1 break;
            proxy_pass http://localhost:8001;
            proxy_set_header Host $host;
        }
    }
}
```

### B. Test Konfigurasi nginx

#### Windows:
```bash
# Test konfigurasi
C:\nginx\nginx.exe -t

# Start nginx
C:\nginx\nginx.exe

# Stop nginx
C:\nginx\nginx.exe -s stop

# Reload konfigurasi
C:\nginx\nginx.exe -s reload
```

#### Linux:
```bash
# Test konfigurasi
sudo nginx -t

# Start nginx
sudo systemctl start nginx

# Stop nginx
sudo systemctl stop nginx

# Reload konfigurasi
sudo systemctl reload nginx
```

---

## LANGKAH 5: Setup PM2 untuk Auto-Start

### A. Buat File Konfigurasi PM2

**File: `ecosystem.config.js`**
```javascript
module.exports = {
  apps: [
    // ========== RESTO SYSTEM ==========
    {
      name: 'resto-backend',
      cwd: './resto/backend',
      script: process.platform === 'win32'
        ? '.venv/Scripts/python.exe'
        : '.venv/bin/python',
      args: 'manage.py runserver 0.0.0.0:8000',
      interpreter: 'none',
      env: {
        DJANGO_SETTINGS_MODULE: 'core.settings',
        PORT: '8000',
      },
      error_file: './logs/resto/backend-error.log',
      out_file: './logs/resto/backend-out.log',
      time: true,
      autorestart: true,
      watch: false,
    },
    {
      name: 'resto-frontend',
      cwd: './resto/frontend',
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      error_file: './logs/resto/frontend-error.log',
      out_file: './logs/resto/frontend-out.log',
      time: true,
      autorestart: true,
      watch: false,
    },

    // ========== HOTELBASE SYSTEM ==========
    {
      name: 'hotel-backend',
      cwd: './hotelbase/backend',
      script: process.platform === 'win32'
        ? '.venv/Scripts/python.exe'
        : '.venv/bin/python',
      args: 'manage.py runserver 0.0.0.0:8001',
      interpreter: 'none',
      env: {
        DJANGO_SETTINGS_MODULE: 'core.settings',
        PORT: '8001',
      },
      error_file: './logs/hotelbase/backend-error.log',
      out_file: './logs/hotelbase/backend-out.log',
      time: true,
      autorestart: true,
      watch: false,
    },
    {
      name: 'hotel-frontend',
      cwd: './hotelbase/frontend',
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      error_file: './logs/hotelbase/frontend-error.log',
      out_file: './logs/hotelbase/frontend-out.log',
      time: true,
      autorestart: true,
      watch: false,
    },
  ],
};
```

### B. Buat Folder Logs

```bash
# Windows
mkdir logs\resto
mkdir logs\hotelbase

# Linux
mkdir -p logs/resto
mkdir -p logs/hotelbase
```

---

## LANGKAH 6: Membuat Script Helper

### A. START_ALL.bat (Windows)

**File: `START_ALL.bat`**
```batch
@echo off
echo ================================================
echo   STARTING HOTELBASE & RESTO SYSTEMS
echo ================================================
echo.

echo [1/4] Starting PM2 processes...
pm2 start ecosystem.config.js

echo.
echo [2/4] Saving PM2 configuration...
pm2 save

echo.
echo [3/4] Starting nginx...
C:\nginx\nginx.exe

echo.
echo [4/4] Checking status...
pm2 status

echo.
echo ================================================
echo   ALL SYSTEMS STARTED!
echo ================================================
echo.
echo Resto System:     http://resto.example.com
echo HotelBase System: http://hotel.example.com
echo.
echo Atau gunakan IP:
echo Resto:     http://192.168.1.100/resto
echo HotelBase: http://192.168.1.100/hotel
echo.
pause
```

### B. STOP_ALL.bat (Windows)

**File: `STOP_ALL.bat`**
```batch
@echo off
echo ================================================
echo   STOPPING ALL SYSTEMS
echo ================================================
echo.

echo [1/2] Stopping PM2 processes...
pm2 stop all
pm2 delete all

echo.
echo [2/2] Stopping nginx...
C:\nginx\nginx.exe -s stop

echo.
echo ================================================
echo   ALL SYSTEMS STOPPED!
echo ================================================
echo.
pause
```

### C. STATUS.bat (Windows)

**File: `STATUS.bat`**
```batch
@echo off
echo ================================================
echo   SYSTEM STATUS CHECK
echo ================================================
echo.

echo [PM2 PROCESSES]
pm2 status

echo.
echo [PORT USAGE]
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :8000
netstat -ano | findstr :8001
netstat -ano | findstr :80

echo.
echo [SYSTEM ACCESS]
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP:~1%
echo.
echo Resto System:
echo   - Domain: http://resto.example.com
echo   - IP:     http://%IP%/resto
echo.
echo HotelBase System:
echo   - Domain: http://hotel.example.com
echo   - IP:     http://%IP%/hotel
echo.
pause
```

### D. Script untuk Linux

**File: `start_all.sh`**
```bash
#!/bin/bash
echo "================================================"
echo "   STARTING HOTELBASE & RESTO SYSTEMS"
echo "================================================"
echo

echo "[1/4] Starting PM2 processes..."
pm2 start ecosystem.config.js

echo
echo "[2/4] Saving PM2 configuration..."
pm2 save
pm2 startup

echo
echo "[3/4] Starting nginx..."
sudo systemctl start nginx

echo
echo "[4/4] Checking status..."
pm2 status

echo
echo "================================================"
echo "   ALL SYSTEMS STARTED!"
echo "================================================"
echo
echo "Resto System:     http://resto.example.com"
echo "HotelBase System: http://hotel.example.com"
echo
```

**File: `stop_all.sh`**
```bash
#!/bin/bash
echo "================================================"
echo "   STOPPING ALL SYSTEMS"
echo "================================================"
echo

echo "[1/2] Stopping PM2 processes..."
pm2 stop all
pm2 delete all

echo
echo "[2/2] nginx still running (managed by systemd)"
echo "To stop nginx: sudo systemctl stop nginx"

echo
echo "================================================"
echo "   ALL SYSTEMS STOPPED!"
echo "================================================"
```

```bash
# Buat executable
chmod +x start_all.sh
chmod +x stop_all.sh
```

---

## LANGKAH 7: Konfigurasi Domain (Opsional)

Jika Anda memiliki domain, konfigurasikan DNS A Record:

### A. Di Provider Domain (Cloudflare, Namecheap, dll)

```
Type: A Record
Name: resto
Content: 192.168.1.100 (IP Server Anda)
TTL: Auto

Type: A Record
Name: hotel
Content: 192.168.1.100 (IP Server Anda)
TTL: Auto
```

### B. Setup SSL dengan Certbot (Opsional - untuk HTTPS)

#### Linux:
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL untuk Resto
sudo certbot --nginx -d resto.example.com

# Generate SSL untuk HotelBase
sudo certbot --nginx -d hotel.example.com

# Auto-renew
sudo certbot renew --dry-run
```

---

## LANGKAH 8: Testing

### A. Test Resto System

```bash
# Test Backend API
curl http://localhost:8000/api/health/
curl http://resto.example.com/api/health/

# Test Frontend
curl http://localhost:3000
curl http://resto.example.com
```

### B. Test HotelBase System

```bash
# Test Backend API
curl http://localhost:8001/api/hotel/license-status/
curl http://hotel.example.com/api/hotel/license-status/

# Test Frontend
curl http://localhost:3001
curl http://hotel.example.com
```

### C. Test dari Browser

1. **Resto**: Buka `http://resto.example.com` atau `http://192.168.1.100/resto`
   - Login dengan: `admin@gmail.com` / `687654`

2. **HotelBase**: Buka `http://hotel.example.com` atau `http://192.168.1.100/hotel`
   - Login dengan kredensial yang dibuat saat setup

---

## Troubleshooting

### ❌ Port Sudah Digunakan

```bash
# Windows - Cek proses di port
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill proses
taskkill /PID <PID> /F

# Linux - Cek proses di port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill proses
sudo kill -9 <PID>
```

### ❌ nginx Error 502 Bad Gateway

**Penyebab**: Backend tidak running

**Solusi**:
```bash
# Cek PM2 status
pm2 status

# Restart backend
pm2 restart resto-backend
pm2 restart hotel-backend

# Cek logs
pm2 logs resto-backend
pm2 logs hotel-backend
```

### ❌ Frontend Tidak Bisa Connect ke Backend

**Penyebab**: CORS atau API URL salah

**Solusi**:
1. Cek file `.env.local` di frontend - pastikan `NEXT_PUBLIC_API_URL` benar
2. Cek file `.env` di backend - pastikan `CORS_ALLOWED_ORIGINS` include frontend URL
3. Restart semua service

### ❌ Database Error

```bash
# Resto - Reset database
cd resto/backend
source .venv/bin/activate  # Linux
.venv\Scripts\activate     # Windows
python manage.py migrate --run-syncdb
python manage.py seed_resto_data

# HotelBase - Reset database
cd hotelbase/backend
source .venv/bin/activate  # Linux
.venv\Scripts\activate     # Windows
uv run python manage.py migrate --run-syncdb
```

### ❌ License Key Invalid (HotelBase)

**Solusi**: Pastikan license key di `hotelbase/backend/.env` dan `hotelbase/frontend/.env.local` sama dan merupakan salah satu dari 16 valid keys:

```
KL-D326F, KL-A829B, KL-L492K, KL-Q183Z, KL-R740M, KL-K915C,
KL-T083X, KL-M672P, KL-V230J, KL-H558N, KL-S904L, KL-W742Q,
KL-B509E, KL-U384T, KL-C276Y, KL-J831D
```

### ❌ Tidak Bisa Akses dari Perangkat Lain

**Solusi**:
1. Pastikan firewall mengizinkan port 80
2. Pastikan semua perangkat di network yang sama
3. Gunakan IP server yang benar (cek dengan `ipconfig` di Windows atau `ip addr` di Linux)

---

## Monitoring & Maintenance

### Melihat Logs

```bash
# Semua logs
pm2 logs

# Logs specific service
pm2 logs resto-backend
pm2 logs resto-frontend
pm2 logs hotel-backend
pm2 logs hotel-frontend

# nginx logs (Linux)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# nginx logs (Windows)
type C:\nginx\logs\access.log
type C:\nginx\logs\error.log
```

### Restart Service

```bash
# Restart semua
pm2 restart all

# Restart specific
pm2 restart resto-backend
pm2 restart hotel-frontend

# Restart nginx
# Linux:
sudo systemctl restart nginx

# Windows:
C:\nginx\nginx.exe -s reload
```

### Backup Database

```bash
# Backup Resto database
cp resto/backend/db.sqlite3 resto/backend/db.sqlite3.backup_$(date +%Y%m%d)

# Backup HotelBase database
cp hotelbase/backend/db.sqlite3 hotelbase/backend/db.sqlite3.backup_$(date +%Y%m%d)
```

---

## Kredensial Default

### Resto System
- **URL**: `http://resto.example.com`
- **Admin**: `admin@gmail.com` / `687654`
- **Manager**: `manager@ladapala.com` / `manager123`
- **Kasir**: `kasir@ladapala.com` / `kasir123`

### HotelBase System
- **URL**: `http://hotel.example.com`
- **Admin**: (sesuai yang dibuat saat `createsuperuser`)
- **License Key**: `KL-U384T` (atau pilih dari 16 valid keys)

---

## Kesimpulan

Sekarang Anda memiliki 2 sistem yang berjalan dalam 1 server:

✅ **Resto System**
- Backend: Port 8000
- Frontend: Port 3000
- Access: `http://resto.example.com`

✅ **HotelBase System**
- Backend: Port 8001
- Frontend: Port 3001
- Access: `http://hotel.example.com`

✅ **nginx** sebagai reverse proxy mengarahkan traffic berdasarkan domain/subdomain

✅ **PM2** mengelola semua proses dan auto-restart jika crash

✅ Kedua sistem dapat diakses dari perangkat manapun di jaringan yang sama

---

## Perintah Cepat

```bash
# Jalankan semua sistem
./START_ALL.bat       # Windows
./start_all.sh        # Linux

# Stop semua sistem
./STOP_ALL.bat        # Windows
./stop_all.sh         # Linux

# Cek status
./STATUS.bat          # Windows
pm2 status            # Linux

# Lihat logs
pm2 logs

# Restart semua
pm2 restart all
```

---

**© 2025 Ladapala - HotelBase & Resto Systems**
