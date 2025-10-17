# Ladapala POS System - Installation Manual

Complete step-by-step guide to install and run the Ladapala Point of Sale system on a new computer.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Fresh Installation Guide](#fresh-installation-guide)
3. [Quick Start (Already Installed)](#quick-start-already-installed)
4. [Testing the Installation](#testing-the-installation)
5. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Supported Operating Systems
- macOS (10.15 or later)
- Ubuntu/Debian Linux (20.04 or later)
- Windows 10/11 (with WSL2 recommended)

### Required Software
- **Python**: 3.12 or higher
- **Node.js**: 18.x or 20.x
- **Bun**: Latest version
- **Git**: For cloning the repository

### Hardware Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Network**: Internet connection for initial setup

---

## Fresh Installation Guide

### Step 1: Install Required Software

#### On macOS:

**1.1 Install Homebrew** (if not installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**1.2 Install Python 3.12:**
```bash
brew install python@3.12
python3 --version
# Should show: Python 3.12.x
```

**1.3 Install Node.js:**
```bash
brew install node@20
node --version
# Should show: v20.x.x
```

**1.4 Install Bun:**
```bash
curl -fsSL https://bun.sh/install | bash
# Restart terminal after installation
bun --version
```

**1.5 Install Git** (if not installed):
```bash
brew install git
git --version
```

#### On Ubuntu/Debian Linux:

**1.1 Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

**1.2 Install Python 3.12:**
```bash
sudo apt install python3.12 python3.12-venv python3-pip -y
python3 --version
# Should show: Python 3.12.x
```

**1.3 Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
node --version
# Should show: v20.x.x
```

**1.4 Install Bun:**
```bash
curl -fsSL https://bun.sh/install | bash
# Add to PATH (if needed)
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun --version
```

**1.5 Install Git:**
```bash
sudo apt install git -y
git --version
```

#### On Windows (WSL2):

**1.1 Install WSL2:**
```powershell
# Run in PowerShell as Administrator
wsl --install
# Restart computer
```

**1.2 Open Ubuntu on WSL2 and follow Ubuntu instructions above**

---

### Step 2: Get the Project Code

**2.1 Clone or Copy the Repository:**

Option A - Using Git:
```bash
# Navigate to where you want the project
cd ~/Documents  # or any directory you prefer

# Clone the repository
git clone <repository-url> ladapala
cd ladapala
```

Option B - Using USB/Download:
```bash
# Copy the ladapala folder to your computer
# Navigate into it
cd /path/to/ladapala
```

**2.2 Verify Project Structure:**
```bash
ls -la
# You should see:
# - backend/     (Django backend)
# - resto/       (Next.js frontend)
# - SETUP.md     (this file)
# - CLAUDE.md
```

---

### Step 3: Setup Backend (Django)

**3.1 Navigate to backend directory:**
```bash
cd backend
```

**3.2 Create Python virtual environment:**
```bash
python3 -m venv venv
```

**3.3 Activate virtual environment:**

On macOS/Linux:
```bash
source venv/bin/activate
# You should see (venv) in your terminal prompt
```

On Windows (WSL2):
```bash
source venv/bin/activate
```

**3.4 Install Python dependencies:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will install:
- Django 5.0.1
- Django REST Framework
- Django CORS Headers
- Django Filter
- Pillow (image handling)

**3.5 Create database:**
```bash
python manage.py migrate
```

You should see output like:
```
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
```

**3.6 Create admin user:**
```bash
python manage.py createsuperuser
```

Follow the prompts:
```
Username: admin
Email address: admin@example.com
Password: [enter password]
Password (again): [re-enter password]
Superuser created successfully.
```

**3.7 Load sample data:**
```bash
python manage.py seed_resto_data
```

This creates:
- 1 Restaurant
- 1 Branch (ID will be 4)
- 6 Categories (Breakfast, Lunch, Soup, Appetizer, Dessert, Beverage)
- 15 Products with images
- 40 Tables
- Sample inventory

**3.8 Verify branch ID:**
```bash
python manage.py shell
```

In the Python shell:
```python
from apps.restaurant.models import Branch
branch = Branch.objects.first()
print(f"Branch ID: {branch.id}")
# Should show: Branch ID: 4
exit()
```

**3.9 Test backend server:**
```bash
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

**3.10 Open browser and test:**
- Admin: http://localhost:8000/admin (login with credentials from step 3.6)
- API: http://localhost:8000/api/
- Products: http://localhost:8000/api/products/

**3.11 Stop the server:**
Press `CTRL+C` in the terminal

---

### Step 4: Setup Frontend (Next.js)

**4.1 Open a NEW terminal window/tab**

**4.2 Navigate to frontend directory:**
```bash
cd /path/to/ladapala/resto
```

**4.3 Install Node.js dependencies:**
```bash
bun install
```

This will install:
- Next.js 15.5.3
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- All other dependencies

**4.4 Create environment file:**
```bash
cp .env.example .env.local
```

**4.5 Edit environment file:**
```bash
# Use any text editor
nano .env.local
# or
code .env.local
# or
vim .env.local
```

**4.6 Configure environment variables:**

Edit `.env.local` to have these values:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_BRANCH_ID=4

# Frontend Configuration
NEXT_PUBLIC_APP_NAME=Ladapala POS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**IMPORTANT**: Make sure `NEXT_PUBLIC_API_BRANCH_ID=4` matches the branch ID from step 3.8

Save and close the file.

**4.7 Test frontend server:**
```bash
bun dev
```

You should see:
```
  ▲ Next.js 15.5.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.3s
```

**4.8 Open browser and test:**
- Dashboard: http://localhost:3000
- Menu: http://localhost:3000/menu
- Transaction: http://localhost:3000/transaction
- Tables: http://localhost:3000/table

**4.9 Keep this terminal running**

---

### Step 5: Run Both Applications Together

Now you should have **TWO terminal windows** running:

**Terminal 1 - Backend:**
```bash
cd /path/to/ladapala/backend
source venv/bin/activate  # On macOS/Linux
python manage.py runserver
```
Running at: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
cd /path/to/ladapala/resto
bun dev
```
Running at: http://localhost:3000

---

## Quick Start (Already Installed)

If you've already installed everything and just want to start the application:

### Terminal 1 - Start Backend:
```bash
cd /path/to/ladapala/backend
source venv/bin/activate
python manage.py runserver
```

### Terminal 2 - Start Frontend:
```bash
cd /path/to/ladapala/resto
bun dev
```

### Access the Application:
- **POS System**: http://localhost:3000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/

---

## Testing the Installation

### Test 1: Check Backend API

**In your browser or using curl:**

```bash
# Test products endpoint
curl http://localhost:8000/api/products/

# Should return JSON with 15 products
```

### Test 2: Check Frontend Pages

**In your browser:**

1. **Dashboard** (http://localhost:3000)
   - Should show statistics (orders, revenue, etc.)
   - Should display without errors

2. **Menu** (http://localhost:3000/menu)
   - Should show 15 products with images
   - Should show category filters
   - Should allow adding items to cart

3. **Transaction** (http://localhost:3000/transaction)
   - Should show "Tidak ada pesanan menunggu pembayaran" (no pending orders)
   - Or show pending orders if any exist

4. **Tables** (http://localhost:3000/table)
   - Should show 40 tables
   - Should show table availability

### Test 3: Create a Test Order

**Step-by-step test:**

1. Go to **Menu** page (http://localhost:3000/menu)
2. Click **+** on any product to add to cart
3. Enter a table number (e.g., "1")
4. Click **"Proses Pesanan"**
5. Enter customer name (e.g., "Test Customer")
6. Click **"Buat Pesanan"**
7. Should see success message

8. Go to **Transaction** page (http://localhost:3000/transaction)
9. Should now see the pending order
10. Enter customer name
11. Enter payment amount
12. Click **"BAYAR"**
13. Should show success and print receipt

### Test 4: Check Database

```bash
cd /path/to/ladapala/backend
source venv/bin/activate
python manage.py shell
```

```python
from apps.restaurant.models import Order, Product, Category

# Check products
print(f"Total Products: {Product.objects.count()}")
# Should show: Total Products: 15

# Check categories
print(f"Total Categories: {Category.objects.count()}")
# Should show: Total Categories: 6

# Check orders
print(f"Total Orders: {Order.objects.count()}")
# Should show number of orders created

exit()
```

---

## Troubleshooting

### Issue 1: "Command not found: python"

**Solution:**
Try `python3` instead:
```bash
python3 --version
python3 manage.py runserver
```

### Issue 2: "Command not found: bun"

**Solution:**
Reinstall Bun and restart terminal:
```bash
curl -fsSL https://bun.sh/install | bash
# Close and reopen terminal
bun --version
```

### Issue 3: Port already in use

**Error:**
```
Error: That port is already in use.
```

**Solution:**

For backend (port 8000):
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
python manage.py runserver 8001
# Update frontend .env.local to use :8001
```

For frontend (port 3000):
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
bun dev --port 3001
```

### Issue 4: No products showing in frontend

**Possible causes:**

1. **Backend not running**
   ```bash
   # Check if backend is running
   curl http://localhost:8000/api/products/
   ```

2. **Wrong branch ID**
   ```bash
   # Check branch ID
   cd backend
   python manage.py shell -c "from apps.restaurant.models import Branch; print(Branch.objects.first().id)"

   # Update resto/.env.local with correct ID
   NEXT_PUBLIC_API_BRANCH_ID=4

   # Restart frontend
   ```

3. **CORS issue**
   - Check browser console (F12)
   - Should not see CORS errors
   - Backend should allow localhost:3000

### Issue 5: Images not showing

**Solution:**

1. Check images exist:
   ```bash
   ls -la backend/media/products/
   # Should list 15 .jpg files
   ```

2. Check backend media URL works:
   ```
   http://localhost:8000/media/products/gudeg.jpg
   ```

3. Check frontend next.config.ts allows remote images

### Issue 6: Database locked

**Error:**
```
django.db.utils.OperationalError: database is locked
```

**Solution:**
```bash
# Stop all Django processes
pkill -f "python.*manage.py"

# Or delete and recreate database
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_resto_data
```

### Issue 7: Module not found errors

**Error:**
```
ModuleNotFoundError: No module named 'rest_framework'
```

**Solution:**
```bash
# Make sure virtual environment is activated
cd backend
source venv/bin/activate
# You should see (venv) in prompt

# Reinstall requirements
pip install -r requirements.txt
```

### Issue 8: Permission denied

**On Linux/Mac:**
```bash
# Make sure you own the project directory
sudo chown -R $USER:$USER /path/to/ladapala
```

---

## Common Commands Reference

### Backend Commands

```bash
# Navigate to backend
cd /path/to/ladapala/backend

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Start server
python manage.py runserver

# Stop server
CTRL+C

# Create migrations (after model changes)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Load sample data
python manage.py seed_resto_data

# Open Django shell
python manage.py shell

# Reset database
rm db.sqlite3
python manage.py migrate
python manage.py seed_resto_data
```

### Frontend Commands

```bash
# Navigate to frontend
cd /path/to/ladapala/resto

# Install dependencies
bun install

# Start development server
bun dev

# Stop server
CTRL+C

# Build for production
bun run build

# Start production server
bun start

# Clean install (if issues)
rm -rf node_modules
rm bun.lock
bun install
```

---

## Directory Structure

```
ladapala/
├── backend/                    # Django backend
│   ├── apps/
│   │   ├── restaurant/        # Main POS app
│   │   │   ├── models.py      # Database models
│   │   │   ├── serializers.py # API serializers
│   │   │   ├── viewsets.py    # API endpoints
│   │   │   └── urls.py        # URL routing
│   │   └── user/             # User management
│   ├── core/
│   │   ├── settings.py       # Django settings
│   │   └── urls.py           # Main URL config
│   ├── media/                # Product images
│   │   └── products/         # 15 product images
│   ├── manage.py             # Django management
│   ├── db.sqlite3           # Database file
│   ├── requirements.txt      # Python dependencies
│   └── venv/                # Virtual environment
│
├── resto/                     # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── (dashboard)/
│   │   │   │   ├── menu/    # Menu page
│   │   │   │   ├── transaction/ # Payment page
│   │   │   │   ├── table/   # Table management
│   │   │   │   └── page.tsx # Dashboard
│   │   ├── components/       # React components
│   │   │   ├── ui/          # shadcn components
│   │   │   ├── receipt.tsx  # Receipt component
│   │   │   └── sidebar.tsx  # Navigation
│   │   └── lib/
│   │       └── api.ts        # API client
│   ├── public/               # Static files
│   ├── .env.local           # Environment config
│   ├── next.config.ts       # Next.js config
│   ├── package.json         # Node dependencies
│   └── bun.lock            # Dependency lock
│
├── SETUP.md                  # This file
└── CLAUDE.md                # Development guide
```

---

## Default Access Information

### URLs
- **Frontend (POS)**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin

### Default Data (After Seeding)
- **Branch ID**: 4
- **Products**: 15 items
- **Categories**: 6 categories
- **Tables**: 40 tables (numbered 1-40)

### Admin Credentials
- Username: (created in step 3.6)
- Password: (created in step 3.6)

---

## Need Help?

### Check Logs

**Backend errors:**
- Look at terminal where `python manage.py runserver` is running
- Errors will appear in red

**Frontend errors:**
- Look at terminal where `bun dev` is running
- Also check browser console (F12 → Console tab)

### Common Questions

**Q: Do I need internet after installation?**
A: No, the system works offline once installed. Internet is only needed for initial setup.

**Q: Can I run this on multiple computers?**
A: Yes, repeat the installation steps on each computer.

**Q: How do I share data between computers?**
A: Copy the `backend/db.sqlite3` file between computers, or use a production database like PostgreSQL.

**Q: Can I customize the products/menu?**
A: Yes, via the admin panel (http://localhost:8000/admin) or by editing the seed data.

**Q: Where are product images stored?**
A: In `backend/media/products/` directory.

---

## Next Steps

Once everything is running:

1. **Explore the Admin Panel**
   - Go to http://localhost:8000/admin
   - Login with your superuser credentials
   - Browse Products, Categories, Orders, Tables, etc.

2. **Try Creating Orders**
   - Use the Menu page to add items
   - Process payments on Transaction page
   - View order history in admin panel

3. **Customize Your Setup**
   - Add your own products
   - Upload product images
   - Configure categories
   - Set up tables for your restaurant

4. **Read Development Guide**
   - See `CLAUDE.md` for code documentation
   - Learn how to add features
   - Understand the architecture

---

**Installation Date**: _____________

**Installed By**: _____________

**Computer Name**: _____________

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

**Document Version**: 1.0
**Last Updated**: 2025-01-12
**Tested On**: macOS Ventura, Ubuntu 22.04, Windows 11 (WSL2)
