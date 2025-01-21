import logging
from rest_framework import serializers
from django.db import transaction
from ..models import Order, OrderItem, MenuItem, Restaurant, Table, MenuItemBooleanOption, Menu
from .menu_serializers import MenuItemBooleanOptionSerializer

logger = logging.getLogger(__name__)

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    selected_options = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=MenuItemBooleanOption.objects.all(),
        required=False
    )
    selected_options_details = MenuItemBooleanOptionSerializer(
        source='selected_options',
        many=True,
        read_only=True
    )
    total_price = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'menu_item',
            'menu_item_name',
            'quantity',
            'special_request',
            'selected_options',
            'selected_options_details',
            'total_price'
        ]

class OrderSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all())
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    items = OrderItemSerializer(source='order_items', many=True, required=True)
    menu = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all(), required=False)
    menu_language = serializers.CharField(source='menu.language', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'restaurant',
            'table',
            'menu',
            'menu_language',
            'status',
            'additional_info',
            'items',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        logger.info("=== Starting Order Validation ===")
        logger.info("Validation data received: %s", data)

        if self.instance is None:
            restaurant = data.get('restaurant')
            table = data.get('table')
            logger.info("Creating new order - Restaurant: %s, Table: %s", restaurant, table)

            if not restaurant or not table:
                logger.error("Validation failed: Missing restaurant or table")
                raise serializers.ValidationError({
                    'error': 'Both restaurant and table are required.'
                })

            # Validate menu belongs to restaurant if provided
            menu = data.get('menu')
            if menu:
                logger.info("Validating menu %s belongs to restaurant %s", menu.id, restaurant.id)
                if menu.restaurant != restaurant:
                    logger.error("Validation failed: Menu %s does not belong to restaurant %s", 
                               menu.id, restaurant.id)
                    raise serializers.ValidationError({
                        'menu': "The selected menu does not belong to the specified restaurant."
                    })

            logger.info("Validating table %s belongs to restaurant %s", table.id, restaurant.id)
            if table.restaurant != restaurant:
                logger.error("Validation failed: Table %s does not belong to restaurant %s", 
                           table.id, restaurant.id)
                raise serializers.ValidationError({
                    'table': "The selected table does not belong to the specified restaurant."
                })
        else:
            status = data.get('status')
            logger.info("Updating existing order - New status: %s", status)
            if status and status not in ['Pending', 'In Progress', 'Completed']:
                logger.error("Validation failed: Invalid status value: %s", status)
                raise serializers.ValidationError({
                    'status': "Invalid status value."
                })

        logger.info("Validation successful")
        return data

    def create(self, validated_data):
        logger.info("=== Starting Order Creation ===")
        logger.info("Validated data: %s", validated_data)

        # Handle both 'items' and 'order_items' field names
        items_data = validated_data.pop('order_items', validated_data.pop('items', []))
        logger.info("Order items data: %s", items_data)

        if not items_data:
            logger.error("No order items provided")
            raise serializers.ValidationError({'error': 'Order items are required'})

        with transaction.atomic():
            try:
                logger.info("Creating order with data: %s", validated_data)
                order = Order.objects.create(**validated_data)
                logger.info("Created order with ID: %s", order.id)

                for index, item_data in enumerate(items_data):
                    logger.info("Processing order item %d: %s", index + 1, item_data)
                    
                    selected_options = item_data.pop('selected_options', [])
                    logger.info("Selected options for item %d: %s", index + 1, selected_options)

                    try:
                        order_item = OrderItem.objects.create(
                            order=order,
                            menu_item=item_data.get('menu_item'),
                            quantity=item_data.get('quantity', 1),
                            special_request=item_data.get('special_request', '')
                        )
                        logger.info("Created order item: %s", order_item)

                        if selected_options:
                            order_item.selected_options.set(selected_options)
                            logger.info("Set selected options for item %d", index + 1)

                    except Exception as item_error:
                        logger.error("Failed to create order item %d: %s", index + 1, str(item_error))
                        raise serializers.ValidationError({
                            'error': f'Failed to create order item {index + 1}: {str(item_error)}'
                        })

                logger.info("Successfully created order with all items")
                return order

            except Exception as e:
                logger.error("Failed to create order: %s", str(e))
                raise serializers.ValidationError({'error': f'Failed to create order: {str(e)}'})
