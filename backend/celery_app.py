# backend/celery_app.py
from __future__ import absolute_import, unicode_literals
import os
import ssl
from celery import Celery
from django.conf import settings
from celery.schedules import crontab  # For scheduling tasks

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize the Celery application with the name 'backend'.
app = Celery('backend')

# Configure Celery to use Django settings with the 'CELERY' namespace.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Retrieve the Redis URL from environment variables.
REDIS_URL = os.environ.get('UPSTASH_REDIS_URL', 'redis://localhost:6379/0')

# Determine if using a secure Redis connection.
if REDIS_URL.startswith('rediss://'):
    # Configure transport options for a secure Redis connection.
    broker_transport_options = {
        'ssl_cert_reqs': ssl.CERT_REQUIRED,  # Options: CERT_REQUIRED, CERT_OPTIONAL, CERT_NONE
    }
    result_backend_transport_options = {
        'ssl_cert_reqs': ssl.CERT_REQUIRED,
    }
else:
    # No SSL configuration for non-secure connections.
    broker_transport_options = {}
    result_backend_transport_options = {}

# Update Celery configuration with broker and backend settings.
app.conf.update(
    broker_url=REDIS_URL,  # Set the broker URL.
    result_backend=REDIS_URL,  # Set the result backend.
    broker_transport_options=broker_transport_options,  # Apply SSL configuration if applicable.
    result_backend_transport_options=result_backend_transport_options,  # Apply SSL for backend.
    beat_schedule={
        'delete-old-orders-every-3-days': {
            'task': 'restaurant.tasks.delete_old_orders_task',  # Path to your task.
            'schedule': crontab(day_of_week='*/3'),  # Every 3 days.
        },
    },
    timezone='UTC',  # Set the timezone as needed.
    task_serializer='json',  # Optional: Configure serializers.
    result_serializer='json',
    accept_content=['json'],
)

# Autodiscover tasks from all installed Django apps.
app.autodiscover_tasks(['restaurant'])


# Optional: Define a debug task for testing purposes.
@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
