#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.hotel.models import HousekeepingTask
from apps.hotel.serializers import HousekeepingTaskSerializer
import json

task = HousekeepingTask.objects.filter(complaint__isnull=False).first()
if task:
    print('Task found!')
    print(f'Task Number: {task.task_number}')
    print(f'Complaint: {task.complaint.complaint_number}')
    print(f'Room: {task.room.number}')
    print(f'Task Type: {task.task_type}')
    print(f'Status: {task.status}')
    print('\nSerialized data:')
    print(json.dumps(HousekeepingTaskSerializer(task).data, indent=2, default=str))
else:
    print('No tasks from complaints found')
