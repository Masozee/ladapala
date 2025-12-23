@echo off
echo ================================================
echo   STARTING HOTELBASE ^& RESTO SYSTEMS
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
