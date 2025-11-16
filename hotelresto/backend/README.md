# Hotelresto - Integrated Hotel & Restaurant Management System

## 📁 Structure

```
hotelresto/
├── backend/    ← Unified Django backend (Hotel + Restaurant)
├── hotel/      ← Hotel management frontend (Next.js)
└── resto/      ← Restaurant POS frontend (Next.js)
```

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
uv run python manage.py runserver
# Runs on: http://localhost:8000
```

### 2. Start Hotel Frontend  
```bash
cd hotel
npm run dev
# Runs on: http://localhost:3000
```

### 3. Start Restaurant Frontend
```bash
cd resto  
npm run dev
# Runs on: http://localhost:3001
```

---

## 🔐 Authentication

**Unified user system with 11 roles:**

**Hotel:** ADMIN, MANAGER, SUPERVISOR, RECEPTIONIST, HOUSEKEEPING, MAINTENANCE  
**Restaurant:** CASHIER, CHEF, WAITRESS, BAR  
**Generic:** STAFF

**System Access:** HOTEL, RESTAURANT, or BOTH

---

## 🌐 API Routes

- Hotel API: `http://localhost:8000/api/hotel/`
- Restaurant API: `http://localhost:8000/api/restaurant/`
- User API: `http://localhost:8000/api/user/`

---

## 📊 Database

**Single SQLite database** with 60+ tables:
- User & HR management (shared)
- Hotel operations (20+ tables)
- Restaurant operations (25+ tables)

Location: `backend/db.sqlite3`

---

## ✨ Features

### Hotel System
- Room & reservation management
- Guest loyalty program
- Housekeeping & maintenance
- Events & function booking
- Financial reporting
- Inventory management

### Restaurant System
- Point of Sale (POS)
- Kitchen & bar order management
- Recipe management
- Inventory & purchase orders
- Customer loyalty & CRM
- Staff session tracking

---

## 📖 Documentation

See [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) for full details.

---

**Status:** ✅ Production Ready  
**Integration Date:** November 16, 2024
