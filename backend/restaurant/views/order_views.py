import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from ..models import Order, OrderItem, Restaurant, Menu, Table
from ..serializers import OrderSerializer

logger = logging.getLogger(__name__)

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

        return queryset.select_related('restaurant', 'menu').prefetch_related(
            'order_items__menu_item',
            'order_items__selected_options'
        )
        
    def create(self, request, *args, **kwargs):
        logger.info("=== Starting Order Creation ===")
        logger.info("Raw request data: %s", request.data)
        
        restaurant_id = request.data.get('restaurant')
        table_id = request.data.get('table')  # Try to get table ID first
        table_number = request.data.get('table_number')  # Fallback to table number
        menu_id = request.data.get('menu')
        order_items = request.data.get('order_items', [])

        logger.info("Parsed values:")
        logger.info("- Restaurant ID: %s (type: %s)", restaurant_id, type(restaurant_id))
        logger.info("- Table ID: %s (type: %s)", table_id, type(table_id))
        logger.info("- Table Number: %s (type: %s)", table_number, type(table_number))
        logger.info("- Menu ID: %s (type: %s)", menu_id, type(menu_id))
        logger.info("- Order Items: %s", order_items)

        if not restaurant_id:
            logger.error("Missing restaurant ID")
            return Response(
                {'error': 'Restaurant ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # If we have a table ID, try to get the table directly
            if table_id:
                try:
                    table = Table.objects.get(id=table_id, restaurant_id=restaurant_id)
                except Table.DoesNotExist:
                    logger.error(f"Table with ID {table_id} not found")
                    return Response(
                        {'error': f'Table with ID {table_id} not found for this restaurant.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            # Otherwise, try to get the table by number
            elif table_number:
                try:
                    table = Table.objects.get(
                        restaurant_id=restaurant_id,
                        number=table_number
                    )
                except Table.DoesNotExist:
                    logger.error(f"Table number {table_number} not found")
                    return Response(
                        {'error': f'Table {table_number} not found for this restaurant.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                logger.error("No table ID or number provided")
                return Response(
                    {'error': 'Either table ID or table number is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set the table ID in the request data
            request.data['table'] = table.id

            # Check for existing pending or in-progress orders
            existing_orders = Order.objects.filter(
                restaurant_id=restaurant_id,
                table=table,
                status__in=['Pending', 'In Progress']
            )

            if existing_orders.exists():
                return Response(
                    {'error': 'An order is already in progress or pending for this table.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get menu if provided
            if menu_id:
                try:
                    menu = Menu.objects.get(id=menu_id, restaurant_id=restaurant_id)
                    request.data['menu'] = menu.id
                except Menu.DoesNotExist:
                    return Response(
                        {'error': 'Invalid menu ID for this restaurant.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validate order items
            if not order_items:
                logger.error("No order items provided")
                return Response(
                    {'error': 'Order items are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return super().create(request, *args, **kwargs)

        except Exception as e:
            logger.error("Error creating order: %s", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='status', permission_classes=[AllowAny])
    def get_order_status(self, request):
        logger.info("=== Getting Order Status ===")
        restaurant_id = request.query_params.get('restaurant')
        table_id = request.query_params.get('table_number')
        
        logger.info("Params - Restaurant ID: %s, Table ID: %s", restaurant_id, table_id)

        if restaurant_id and table_id:
            try:
                logger.info("Querying orders for restaurant %s and table %s", restaurant_id, table_id)
                orders = Order.objects.filter(
                    restaurant_id=restaurant_id,
                    table_id=table_id,
                    status__in=['Pending', 'In Progress', 'Completed']
                ).select_related('menu')

                if orders.exists():
                    logger.info("Found %d orders", orders.count())
                    order_status = []
                    for order in orders:
                        try:
                            status_details = order.get_order_details()
                            order_status.append(status_details)
                            logger.info("Order %s status: %s", order.id, status_details)
                        except Exception as detail_error:
                            logger.error("Error getting details for order %s: %s", order.id, str(detail_error))
                    
                    return Response(order_status, status=status.HTTP_200_OK)

                logger.info("No orders found for restaurant %s and table %s", restaurant_id, table_id)
                return Response({'error': 'No orders found for this table'}, status=status.HTTP_404_NOT_FOUND)

            except Exception as e:
                logger.error("Error retrieving order status: %s", str(e))
                return Response({'error': 'Failed to retrieve order status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.error("Invalid request parameters - restaurant_id: %s, table_id: %s", restaurant_id, table_id)
        return Response({'error': 'Invalid restaurant or table ID.'}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        logger.info("=== Updating Order ===")
        order = self.get_object()
        logger.info("Order ID: %s, Current status: %s", order.id, order.status)
        
        # Log the user attempting the update
        user_info = {
            'id': self.request.user.id if self.request.user else None,
            'username': self.request.user.username if self.request.user else None,
            'is_staff': self.request.user.groups.filter(name='restaurant_staff').exists() if self.request.user else False,
            'is_owner': (order.restaurant.owner == self.request.user) if self.request.user else False
        }
        logger.info("User attempting update: %s", user_info)

        # Check permissions
        if order.restaurant.owner == self.request.user or self.request.user.groups.filter(name='restaurant_staff').exists():
            try:
                # Log the changes being made
                logger.info("Update data: %s", serializer.validated_data)
                updated_order = serializer.save()
                logger.info("Order updated successfully. New status: %s", updated_order.status)
            except Exception as e:
                logger.error("Failed to update order: %s", str(e))
                raise
        else:
            logger.error("Permission denied for user %s to update order %s", 
                        user_info['username'], order.id)
            raise PermissionDenied("You don't have permission to update orders for this restaurant.")

    def perform_destroy(self, instance):
        logger.info("=== Deleting Order ===")
        logger.info("Order ID: %s, Status: %s", instance.id, instance.status)
        
        # Log the user attempting the deletion
        user_info = {
            'id': self.request.user.id if self.request.user else None,
            'username': self.request.user.username if self.request.user else None,
            'is_staff': self.request.user.groups.filter(name='restaurant_staff').exists() if self.request.user else False,
            'is_owner': (instance.restaurant.owner == self.request.user) if self.request.user else False
        }
        logger.info("User attempting deletion: %s", user_info)

        # Check permissions
        if instance.restaurant.owner == self.request.user or self.request.user.groups.filter(name='restaurant_staff').exists():
            try:
                # Log order details before deletion
                logger.info("Deleting order - Restaurant: %s, Table: %s, Items count: %s", 
                          instance.restaurant.id, instance.table.id, 
                          instance.order_items.count())
                instance.delete()
                logger.info("Order %s deleted successfully", instance.id)
            except Exception as e:
                logger.error("Failed to delete order %s: %s", instance.id, str(e))
                raise
        else:
            logger.error("Permission denied for user %s to delete order %s", 
                        user_info['username'], instance.id)
            raise PermissionDenied("You don't have permission to delete orders for this restaurant.")
