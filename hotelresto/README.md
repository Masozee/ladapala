# Hotelresto - Integrated Hotel & Restaurant Management System

## 📁 Clean Structure (Restructured Nov 16, 2024)

```
hotelresto/
├── backend/    ← Unified Django backend (Hotel + Restaurant)
├── hotel/      ← Hotel management frontend (Next.js)
└── resto/      ← Restaurant POS frontend (Next.js)
```

**One backend, two frontends - Clean and simple!**

---

## 🚀 Quick Start

### 1. Start Backend (Port 8000)
```bash
cd backend
uv run python manage.py runserver
```

### 2. Start Hotel Frontend (Port 3000)
```bash
cd hotel
npm run dev
```

### 3. Start Restaurant Frontend (Port 3001)
```bash
cd resto
npm run dev
```

---

## 🔐 Unified Authentication

**11 User Roles:**
- **Hotel:** ADMIN, MANAGER, SUPERVISOR, RECEPTIONIST, HOUSEKEEPING, MAINTENANCE
- **Restaurant:** CASHIER, CHEF, WAITRESS, BAR
- **Generic:** STAFF

**System Access Levels:**
- `HOTEL` - Hotel system only
- `RESTAURANT` - Restaurant system only  
- `BOTH` - Full access to both systems

---

## 🌐 API Endpoints

**Base URL:** `http://localhost:8000`

- **Hotel:** `/api/hotel/` (rooms, reservations, guests, housekeeping, etc.)
- **Restaurant:** `/api/restaurant/` (products, orders, POS, inventory, etc.)
- **User:** `/api/user/` (login, profile, employees, departments, etc.)

---

## 📊 Database

**Single SQLite Database:** `backend/db.sqlite3`

- User & HR: 5 tables (shared)
- Hotel: 20+ tables
- Restaurant: 25+ tables
- **Total:** 60+ tables

---

## ✨ Features

### Hotel Management
✅ Rooms & reservations  
✅ Guest management & loyalty  
✅ Housekeeping & maintenance  
✅ Events & function booking  
✅ Financial reporting  
✅ Inventory management  
✅ Lost & Found  
✅ Wake-up calls

### Restaurant Management
✅ Point of Sale (POS)  
✅ Kitchen & bar orders  
✅ Recipe management  
✅ Inventory & purchase orders  
✅ Vendor management  
✅ Customer loyalty & CRM  
✅ Staff session tracking  
✅ Cashier shift management

---

## 📖 Documentation

- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - Full integration details
- [RESTRUCTURE_PLAN.md](RESTRUCTURE_PLAN.md) - Restructuring process

---

## 🎯 Status

✅ **Backend Integration:** Complete  
✅ **Structure Cleanup:** Complete  
✅ **Documentation:** Complete  
✅ **Status:** Production Ready

**Integration Date:** November 16, 2024

---

*Clean, simple structure with one unified backend powering both hotel and restaurant systems.*
