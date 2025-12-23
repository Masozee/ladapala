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
