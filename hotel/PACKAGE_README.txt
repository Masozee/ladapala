╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║           HOTEL MANAGEMENT SYSTEM - INSTALLATION PACKAGE             ║
║                    Windows 11 Edition v1.0                           ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

📦 PACKAGE CONTENTS
═══════════════════════════════════════════════════════════════════════

This ZIP file contains everything you need to run the Hotel Management
System on Windows 11.

INCLUDED:
✓ Complete backend (Django) source code
✓ Complete frontend (Next.js) source code
✓ All launcher scripts (.bat files)
✓ Complete documentation
✓ Configuration files (.env)
✓ Sample database structure
✓ Automated setup scripts

NOT INCLUDED (will be installed automatically):
✗ Python packages (installed by setup script)
✗ Node.js packages (installed by setup script)
✗ Virtual environment (created by setup script)
✗ Build artifacts (created on first run)


🚀 QUICK INSTALLATION GUIDE
═══════════════════════════════════════════════════════════════════════

STEP 1: EXTRACT THE ZIP FILE
  1. Right-click the ZIP file
  2. Select "Extract All..."
  3. Choose a location (e.g., C:\Hotel)
  4. Click "Extract"

STEP 2: INSTALL PREREQUISITES
  Before running the setup, install:

  • Python 3.12 or higher
    Download: https://www.python.org/downloads/
    ⚠️ IMPORTANT: Check "Add Python to PATH" during installation

  • Node.js 20 LTS or higher
    Download: https://nodejs.org/

STEP 3: RUN THE SETUP
  1. Open the extracted folder
  2. Read "START_HERE.txt" for detailed instructions
  3. Double-click "SETUP_FIRST_TIME.bat"
  4. Follow the on-screen prompts
  5. Create an admin user when asked

STEP 4: START USING
  1. Double-click "START_HOTEL.bat"
  2. Wait for both servers to start
  3. Open browser to: http://localhost:3000


📋 SYSTEM REQUIREMENTS
═══════════════════════════════════════════════════════════════════════

MINIMUM:
  • Windows 10 or Windows 11
  • Python 3.12 or higher
  • Node.js 18 or higher
  • 4GB RAM
  • 2GB free disk space
  • Internet connection (for initial setup)

RECOMMENDED:
  • Windows 11
  • Python 3.12+
  • Node.js 20 LTS
  • 8GB RAM
  • 5GB free disk space
  • SSD storage


📁 FOLDER STRUCTURE AFTER EXTRACTION
═══════════════════════════════════════════════════════════════════════

hotel/
├── START_HERE.txt              👈 Read this first!
├── MENU.bat                    Main menu launcher
├── START_HOTEL.bat             Quick start launcher
├── SETUP_FIRST_TIME.bat        Initial setup script
├── STOP_SERVERS.bat            Stop all servers
├── README_WINDOWS.md           Full documentation
├── QUICK_START.txt             Quick reference
├── backend/                    Django backend
│   ├── .env                    Configuration
│   ├── manage.py               Django manager
│   ├── requirements.txt        Python dependencies
│   └── core/                   Core application
└── frontend/                   Next.js frontend
    ├── .env                    Configuration
    ├── package.json            Node dependencies
    └── src/                    Application code


🔧 WHAT HAPPENS DURING SETUP
═══════════════════════════════════════════════════════════════════════

The SETUP_FIRST_TIME.bat script will:

1. ✓ Verify Python and Node.js are installed
2. ✓ Create Python virtual environment (.venv)
3. ✓ Install Python dependencies (~200MB)
4. ✓ Install Node.js dependencies (~600MB)
5. ✓ Initialize the database (SQLite)
6. ✓ Run database migrations
7. ✓ Prompt you to create an admin user

Total setup time: 5-15 minutes (depending on internet speed)
Total disk space after setup: ~3GB


⚠️ IMPORTANT NOTES
═══════════════════════════════════════════════════════════════════════

LICENSE:
  • Pre-configured license key: KL-U384T
  • No additional activation needed

FIREWALL:
  • Windows may ask for firewall permission
  • Click "Allow access" when prompted

INTERNET:
  • Required ONLY for initial setup (downloading dependencies)
  • Not required for daily use after setup

ANTIVIRUS:
  • Some antivirus software may flag .bat files
  • These are safe installation scripts
  • You may need to add an exception


🌐 ACCESS POINTS (AFTER INSTALLATION)
═══════════════════════════════════════════════════════════════════════

Main Application:   http://localhost:3000
Admin Panel:        http://localhost:8000/admin
API Documentation:  http://localhost:8000


📞 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════

Problem: "Python is not recognized"
Solution:
  1. Reinstall Python
  2. Check "Add Python to PATH" during installation
  3. Restart your computer
  4. Run SETUP_FIRST_TIME.bat again

Problem: "Node is not recognized"
Solution:
  1. Reinstall Node.js
  2. Restart your computer
  3. Run SETUP_FIRST_TIME.bat again

Problem: Setup fails during installation
Solution:
  1. Check your internet connection
  2. Temporarily disable antivirus
  3. Run Command Prompt as Administrator
  4. Navigate to the hotel folder
  5. Run SETUP_FIRST_TIME.bat again

Problem: Can't access http://localhost:3000
Solution:
  1. Make sure both terminal windows are open
  2. Check for error messages in the terminals
  3. Run CHECK_SYSTEM.bat to diagnose
  4. Try stopping and starting again

For more help:
  • Read README_WINDOWS.md (complete documentation)
  • Run CHECK_SYSTEM.bat (system diagnostics)


💾 BACKUP & DATA
═══════════════════════════════════════════════════════════════════════

Your data is stored in:
  • Database: backend/db.sqlite3
  • Uploaded files: backend/media/

To backup:
  • Use BACKUP_DATABASE.bat (recommended)
  • Or manually copy these files to a safe location


🔄 UPDATES
═══════════════════════════════════════════════════════════════════════

To update the system:
  1. Stop all servers (STOP_SERVERS.bat)
  2. Backup your database (BACKUP_DATABASE.bat)
  3. Extract new version to a different folder
  4. Copy backend/db.sqlite3 from old to new folder
  5. Copy backend/media/ from old to new folder
  6. Run SETUP_FIRST_TIME.bat in new folder


📄 FILES INCLUDED IN THIS PACKAGE
═══════════════════════════════════════════════════════════════════════

Launcher Scripts (10):
  ✓ MENU.bat
  ✓ START_HOTEL.bat
  ✓ START_HOTEL_ADVANCED.bat
  ✓ SETUP_FIRST_TIME.bat
  ✓ STOP_SERVERS.bat
  ✓ OPEN_BROWSER.bat
  ✓ CHECK_SYSTEM.bat
  ✓ BACKUP_DATABASE.bat
  ✓ CREATE_SHORTCUTS.bat

Documentation (6):
  ✓ START_HERE.txt
  ✓ QUICK_START.txt
  ✓ VISUAL_GUIDE.txt
  ✓ README_WINDOWS.md
  ✓ SCRIPTS_OVERVIEW.md
  ✓ DEPLOYMENT_SUMMARY.md
  ✓ PACKAGE_README.txt (this file)

Source Code:
  ✓ Complete Django backend
  ✓ Complete Next.js frontend
  ✓ All configuration files
  ✓ Database schema


✨ FEATURES
═══════════════════════════════════════════════════════════════════════

✓ One-click installation and startup
✓ Automatic dependency management
✓ Pre-configured for Windows 11
✓ Interactive menu system
✓ Built-in system diagnostics
✓ Automatic database backups
✓ Desktop shortcut creation
✓ Comprehensive documentation


═══════════════════════════════════════════════════════════════════════

              Ready to install? Extract the ZIP and read
                        START_HERE.txt

═══════════════════════════════════════════════════════════════════════

Package Version: 1.0
Package Date: November 2025
Compatible: Windows 11 / Windows 10
License: KL-U384T (Pre-configured)
