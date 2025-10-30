from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import psutil
import platform
from datetime import datetime, timedelta
from django.utils import timezone


@api_view(['GET'])
def system_resources(request):
    """
    GET /api/hotel/system/resources/

    Returns real-time system resource usage including:
    - CPU usage percentage
    - Memory usage percentage and details
    - Disk usage percentage and details
    - System uptime
    - Process count
    """
    try:
        # CPU Usage
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()

        # Memory Usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_total = memory.total / (1024 ** 3)  # Convert to GB
        memory_used = memory.used / (1024 ** 3)
        memory_available = memory.available / (1024 ** 3)

        # Disk Usage
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_total = disk.total / (1024 ** 3)  # Convert to GB
        disk_used = disk.used / (1024 ** 3)
        disk_free = disk.free / (1024 ** 3)

        # System Uptime
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        uptime_days = uptime.days
        uptime_hours = uptime.seconds // 3600
        uptime_minutes = (uptime.seconds % 3600) // 60

        # Process Information
        process_count = len(psutil.pids())

        # System Information
        system_info = {
            'platform': platform.system(),
            'platform_release': platform.release(),
            'platform_version': platform.version(),
            'architecture': platform.machine(),
            'hostname': platform.node(),
            'processor': platform.processor(),
        }

        # Network I/O
        net_io = psutil.net_io_counters()

        response_data = {
            'timestamp': timezone.now().isoformat(),
            'cpu': {
                'usage_percent': round(cpu_percent, 1),
                'count': cpu_count,
                'frequency': {
                    'current': round(cpu_freq.current, 2) if cpu_freq else None,
                    'min': round(cpu_freq.min, 2) if cpu_freq else None,
                    'max': round(cpu_freq.max, 2) if cpu_freq else None,
                } if cpu_freq else None,
            },
            'memory': {
                'usage_percent': round(memory_percent, 1),
                'total_gb': round(memory_total, 2),
                'used_gb': round(memory_used, 2),
                'available_gb': round(memory_available, 2),
            },
            'disk': {
                'usage_percent': round(disk_percent, 1),
                'total_gb': round(disk_total, 2),
                'used_gb': round(disk_used, 2),
                'free_gb': round(disk_free, 2),
            },
            'uptime': {
                'days': uptime_days,
                'hours': uptime_hours,
                'minutes': uptime_minutes,
                'boot_time': boot_time.isoformat(),
                'total_seconds': int(uptime.total_seconds()),
            },
            'processes': {
                'count': process_count,
            },
            'network': {
                'bytes_sent': net_io.bytes_sent,
                'bytes_received': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_received': net_io.packets_recv,
            },
            'system': system_info,
        }

        return Response(response_data)

    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve system resources: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def system_stats(request):
    """
    GET /api/hotel/system/stats/

    Returns simplified system statistics for dashboard display
    """
    try:
        # Get basic metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent

        # Calculate uptime percentage (assume 99.9% if running)
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        uptime_percentage = 99.9  # Simplified - in production, track actual downtime

        # Process count
        process_count = len(psutil.pids())

        response_data = {
            'serverLoad': round(cpu_percent, 1),
            'diskUsage': round(disk_percent, 1),
            'memoryUsage': round(memory_percent, 1),
            'systemUptime': f"{uptime_percentage}%",
            'processCount': process_count,
            'uptimeDays': uptime.days,
        }

        return Response(response_data)

    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve system stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def process_list(request):
    """
    GET /api/hotel/system/processes/

    Returns list of running processes with resource usage
    """
    try:
        processes = []

        for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'status']):
            try:
                pinfo = proc.info
                processes.append({
                    'pid': pinfo['pid'],
                    'name': pinfo['name'],
                    'username': pinfo['username'],
                    'cpu_percent': round(pinfo['cpu_percent'] or 0, 2),
                    'memory_percent': round(pinfo['memory_percent'] or 0, 2),
                    'status': pinfo['status'],
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass

        # Sort by CPU usage descending
        processes.sort(key=lambda x: x['cpu_percent'], reverse=True)

        # Limit to top 50 processes
        processes = processes[:50]

        return Response({
            'processes': processes,
            'count': len(processes)
        })

    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve process list: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
