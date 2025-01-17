from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from ..models import Order, OrderItem, Restaurant
from ..serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ['create', 'get_order_status']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Order.objects.all()
        restaurant_id = self.request.query_params.get('restaurant')

        if restaurant_id is not None:
            if self.request.user.is_authenticated:
                queryset = queryset.filter(restaurant__id=restaurant_id)
            else:
                return Order.objects.none()

        return queryset.select_related('restaurant').prefetch_related(
            'order_items__menu_item',
            'order_items__selected_options'
        )
        
    def create(self, request, *args, **kwargs):
        restaurant_id = request.data.get('restaurant')
        table_id = request.data.get('table')

        # Check for existing pending or in-progress orders
        existing_orders = Order.objects.filter(
            restaurant_id=restaurant_id,
            table_id=table_id,
            status__in=['Pending', 'In Progress']
        )

        if existing_orders.exists():
            return Response(
                {'error': 'An order is already in progress or pending for this table.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='status', permission_classes=[AllowAny])
    def get_order_status(self, request):
        restaurant_id = request.query_params.get('restaurant')
        table_id = request.query_params.get('table_number')

        if restaurant_id and table_id:
            try:
                orders = Order.objects.filter(
                    restaurant_id=restaurant_id,
                    table_id=table_id,
                    status__in=['Pending', 'In Progress', 'Completed']
                )

                if orders.exists():
                    order_status = []
                    for order in orders:
                        items = OrderItem.objects.filter(order=order).select_related('menu_item')
                        item_details = [
                            {
                                'menu_item': item.menu_item.name,
                                'quantity': item.quantity,
                                'special_request': item.special_request,
                                'selected_options': [option.name for option in item.selected_options.all()],
                            }
                            for item in items
                        ]

                        order_status.append({
                            'id': order.id,
                            'status': order.status,
                            'items': item_details,
                            'additional_info': order.additional_info
                        })

                    return Response(order_status, status=status.HTTP_200_OK)

                return Response({'error': 'No orders found for this table'}, status=status.HTTP_404_NOT_FOUND)

            except Exception as e:
                return Response({'error': 'Failed to retrieve order status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'error': 'Invalid restaurant or table ID.'}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        order = self.get_object()
        if order.restaurant.owner == self.request.user or self.request.user.groups.filter(name='restaurant_staff').exists():
            serializer.save()
        else:
            raise PermissionDenied("You don't have permission to update orders for this restaurant.")

    def perform_destroy(self, instance):
        if instance.restaurant.owner == self.request.user or self.request.user.groups.filter(name='restaurant_staff').exists():
            instance.delete()
        else:
            raise PermissionDenied("You don't have permission to delete orders for this restaurant.")
