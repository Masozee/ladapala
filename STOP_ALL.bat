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
