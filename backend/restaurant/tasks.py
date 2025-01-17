# restaurant/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import Order

@shared_task
def delete_old_orders_task():
    print("deleting old orders")
    cutoff_date = timezone.now() - timezone.timedelta(days=3)
    old_orders = Order.objects.filter(created_at__lt=cutoff_date)
    deleted_count, _ = old_orders.delete()
    return f"Deleted {deleted_count} old orders"
