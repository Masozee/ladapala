#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Ladapala Development Mode${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check if tmux is installed
if command -v tmux &> /dev/null; then
    echo -e "${GREEN}Using tmux for better terminal management${NC}"
    echo
    
    # Kill any existing session
    tmux kill-session -t ladapala 2>/dev/null || true
    
    # Create new tmux session
    tmux new-session -d -s ladapala -n backend
    
    # Backend window
    tmux send-keys -t ladapala:backend "cd backend && python manage.py runserver 8000" C-m
    
    # Restaurant POS window
    tmux new-window -t ladapala -n resto
    tmux send-keys -t ladapala:resto "cd resto && bun dev" C-m
    
    # Hotel Management window
    tmux new-window -t ladapala -n hotel
    tmux send-keys -t ladapala:hotel "cd hotel && bun dev" C-m
    
    # Status window
    tmux new-window -t ladapala -n status
    tmux send-keys -t ladapala:status "watch -n 5 ./status.sh" C-m
    
    echo -e "${GREEN}✓ All services started in tmux session 'ladapala'${NC}"
    echo
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  Attach to session:  ${GREEN}tmux attach -t ladapala${NC}"
    echo -e "  Switch windows:     ${GREEN}Ctrl+B then 0-3${NC}"
    echo -e "  Detach:            ${GREEN}Ctrl+B then D${NC}"
    echo -e "  Kill session:      ${GREEN}tmux kill-session -t ladapala${NC}"
    echo
    echo -e "${BLUE}Window Layout:${NC}"
    echo "  0: backend   - Django API"
    echo "  1: resto     - Restaurant POS"
    echo "  2: hotel     - Hotel Management"
    echo "  3: status    - Service Status"
    echo
    echo -e "${GREEN}Attaching to tmux session...${NC}"
    tmux attach -t ladapala
    
elif command -v osascript &> /dev/null; then
    # macOS - use Terminal tabs
    echo -e "${GREEN}Using Terminal tabs (macOS)${NC}"
    echo
    
    # Backend
    osascript -e 'tell application "Terminal"
        activate
        do script "cd '"$PWD"'/backend && python manage.py runserver 8000"
        set current settings of selected tab of window 1 to settings set "Pro"
        set custom title of selected tab of window 1 to "Backend API"
    end tell'
    
    # Restaurant POS
    osascript -e 'tell application "Terminal"
        activate
        tell application "System Events" to keystroke "t" using command down
        do script "cd '"$PWD"'/resto && bun dev" in selected tab of window 1
        set custom title of selected tab of window 1 to "Restaurant POS"
    end tell'
    
    # Hotel Management
    osascript -e 'tell application "Terminal"
        activate
        tell application "System Events" to keystroke "t" using command down
        do script "cd '"$PWD"'/hotel && bun dev" in selected tab of window 1
        set custom title of selected tab of window 1 to "Hotel Management"
    end tell'
    
    echo -e "${GREEN}✓ All services started in separate Terminal tabs${NC}"
    echo
    
else
    # Fallback to background processes
    echo -e "${YELLOW}tmux not found. Using background processes...${NC}"
    echo -e "${YELLOW}Install tmux for better experience: brew install tmux${NC}"
    echo
    ./start-all.sh
fi

echo -e "${BLUE}========================================${NC}"