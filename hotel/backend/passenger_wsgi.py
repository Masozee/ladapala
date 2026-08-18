"""
WSGI config for cPanel/Passenger deployment
For smkpariwisatamengwitani.com

This file is used by cPanel's Passenger to serve the Django application.
Update the INTERP path to match your Python virtual environment path.
"""

import os
import sys

# IMPORTANT: Update this path to match your cPanel Python virtual environment
# Find your path in cPanel Terminal by running: which python3
# Example: /home/username/virtualenv/hotel_backend/bin/python3
INTERP = "/home/username/virtualenv/hotel_backend/bin/python3"

# This ensures the correct Python interpreter is used
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add the project directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    from pathlib import Path
    env_path = Path(current_dir) / '.env'
    load_dotenv(env_path)
except ImportError:
    pass  # python-dotenv not installed

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
os.environ.setdefault('DJANGO_ENV', 'production')

# Import Django WSGI application
from core.wsgi import application

# For debugging (uncomment if needed)
# import traceback
# try:
#     from core.wsgi import application
# except Exception as e:
#     with open('/tmp/hotel_wsgi_error.log', 'w') as f:
#         f.write(f"Error: {str(e)}\n")
#         f.write(traceback.format_exc())
#     raise