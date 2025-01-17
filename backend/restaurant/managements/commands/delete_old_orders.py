import datetime
from django.core.management.base import BaseCommand
from restaurant_app.models import Order

class Command(BaseCommand):
    help = 'Deletes orders older than 3 days'

    def handle(self, *args, **kwargs):
        # Calculate the cutoff date
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=3)
        
        # Filter and delete orders older than the cutoff date
        old_orders = Order.objects.filter(created_at__lt=cutoff_date)
        count, _ = old_orders.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} old orders."))
