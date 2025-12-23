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
