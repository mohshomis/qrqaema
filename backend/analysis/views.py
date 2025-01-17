# analysis/views.py

from django.shortcuts import render
from django.views import View
from django.db.models import Count, Sum, Avg, Q
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseForbidden
from django.db.models.functions import TruncDate, TruncMonth, ExtractHour
from restaurant.models import Restaurant, Order, OrderItem, MenuItem, Table
import datetime

class SuperUserRequiredMixin(LoginRequiredMixin):
    """
    Mixin to ensure the user is authenticated and is a superuser.
    """
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return HttpResponseForbidden("You do not have permission to access this page.")
        return super().dispatch(request, *args, **kwargs)

class DashboardView(SuperUserRequiredMixin, View):
    """
    Dashboard view displaying various analytics across all restaurants.
    Accessible only to superusers.
    """

    def get(self, request):
        # ------------------
        # General Metrics
        # ------------------
        total_restaurants = Restaurant.objects.count()
        total_orders = Order.objects.count()
        total_revenue = OrderItem.objects.aggregate(total=Sum('total_price'))['total'] or 0
        total_tables = Table.objects.count()
        average_order_value = OrderItem.objects.aggregate(avg=Avg('total_price'))['avg'] or 0

        # ------------------
        # Order Metrics
        # ------------------
        # 1. Orders per Restaurant
        orders_per_restaurant = Restaurant.objects.annotate(order_count=Count('orders')).order_by('-order_count')[:10]

        # 2. Orders by Time of Day
        orders_by_hour = Order.objects.annotate(
            hour=ExtractHour('created_at')
        ).values('hour').annotate(
            order_count=Count('id')
        ).order_by('hour')

        # 3. Order Completion Rate
        total_completed_orders = Order.objects.filter(status='Completed').count()
        order_completion_rate = (total_completed_orders / total_orders) * 100 if total_orders > 0 else 0

        # 4. Average Preparation Time
        # Assuming Order model has 'preparation_time' in minutes
        average_preparation_time = Order.objects.aggregate(avg_prep=Avg('preparation_time'))['avg_prep'] or 0

        # 5. Order Cancellation Rate
        canceled_orders = Order.objects.filter(status='Canceled').count()
        order_cancellation_rate = (canceled_orders / total_orders) * 100 if total_orders > 0 else 0

        # 6. Top Selling Menu Items
        top_selling_menu_items = OrderItem.objects.values('menu_item__name').annotate(
            total_quantity=Sum('quantity')
        ).order_by('-total_quantity')[:10]

        # 7. Average Items per Order
        average_items_per_order = OrderItem.objects.aggregate(avg_items=Avg('quantity'))['avg_items'] or 0

        # 8. Revenue by Menu Category
        revenue_by_menu_category = OrderItem.objects.values('menu_item__category__name').annotate(
            total_sales=Sum('total_price')
        ).order_by('-total_sales')

        # 9. Sales Trends Over Time
        sales_trends_over_time = OrderItem.objects.filter(
            order__created_at__date__gte=datetime.date.today() - datetime.timedelta(days=365)
        ).annotate(month=TruncMonth('order__created_at')).values('month').annotate(
            total_sales=Sum('total_price')
        ).order_by('month')

        # ------------------
        # Table Metrics
        # ------------------
        # 10. Table Utilization Rate
        occupied_tables = Table.objects.filter(status='Occupied').count()
        table_utilization_rate = (occupied_tables / total_tables) * 100 if total_tables > 0 else 0

        # 11. Top 10 Tables by Number of Orders
        table_utilization = Table.objects.annotate(
            order_count=Count('orders')
        ).order_by('-order_count')[:10]

        # ------------------
        # Menu Interaction Metrics
        # ------------------
        # 12. Most Accessed Menus
        most_accessed_menus = MenuItem.objects.annotate(
            access_count=Count('orderitem')
        ).order_by('-access_count')[:10]

        # 13. Menu Update Frequency
        menu_update_frequency = MenuItem.objects.annotate(
            update_count=Count('id')
        ).values('restaurant__name').annotate(
            update_count=Count('id')
        ).order_by('-update_count')[:10]

        # 14. Average Time Spent on Menu Pages
        # Placeholder: Requires tracking user interactions
        average_time_spent_on_menu = 0  # Implement if tracking is available

        # ------------------
        # Additional Metrics
        # ------------------
        # 15. Active Users
        active_users = Order.objects.values('user').distinct().count()

        # 16. New Users (Last 30 Days)
        new_users = Order.objects.filter(created_at__gte=datetime.datetime.now()-datetime.timedelta(days=30)).values('user').distinct().count()

        context = {
            # General Metrics
            'total_restaurants': total_restaurants,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'total_tables': total_tables,
            'average_order_value': average_order_value,

            # Order Metrics
            'orders_per_restaurant': orders_per_restaurant,
            'orders_by_hour': orders_by_hour,
            'order_completion_rate': order_completion_rate,
            'average_preparation_time': average_preparation_time,
            'order_cancellation_rate': order_cancellation_rate,
            'top_selling_menu_items': top_selling_menu_items,
            'average_items_per_order': average_items_per_order,
            'revenue_by_menu_category': revenue_by_menu_category,
            'sales_trends_over_time': sales_trends_over_time,

            # Table Metrics
            'table_utilization_rate': table_utilization_rate,
            'table_utilization': table_utilization,

            # Menu Interaction Metrics
            'most_accessed_menus': most_accessed_menus,
            'menu_update_frequency': menu_update_frequency,
            'average_time_spent_on_menu': average_time_spent_on_menu,

            # Additional Metrics
            'active_users': active_users,
            'new_users': new_users,
        }

        return render(request, 'analysis/dashboard.html', context)
