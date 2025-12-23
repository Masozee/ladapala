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
