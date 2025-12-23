#!/bin/bash
echo "================================================"
echo "   SYSTEM STATUS CHECK"
echo "================================================"
echo

echo "[PM2 PROCESSES]"
pm2 status

echo
echo "[PORT USAGE]"
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :8000
sudo lsof -i :8001
sudo lsof -i :80

echo
echo "[SYSTEM ACCESS]"
IP=$(hostname -I | awk '{print $1}')
echo
echo "Resto System:"
echo "  - Domain: http://resto.example.com"
echo "  - IP:     http://$IP/resto"
echo
echo "HotelBase System:"
echo "  - Domain: http://hotel.example.com"
echo "  - IP:     http://$IP/hotel"
echo
