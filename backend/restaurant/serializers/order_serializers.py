from rest_framework import serializers
from django.db import transaction
from ..models import Order, OrderItem, MenuItem, Restaurant, Table, MenuItemBooleanOption, Menu
from .menu_serializers import MenuItemBooleanOptionSerializer

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
    items = OrderItemSerializer(source='order_items', many=True, required=False)
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
        if self.instance is None:
            restaurant = data.get('restaurant')
            table = data.get('table')

            if not restaurant or not table:
                raise serializers.ValidationError({
                    'error': 'Both restaurant and table are required.'
                })

            # Validate menu belongs to restaurant if provided
            menu = data.get('menu')
            if menu and menu.restaurant != restaurant:
                raise serializers.ValidationError({
                    'menu': "The selected menu does not belong to the specified restaurant."
                })

            if table.restaurant != restaurant:
                raise serializers.ValidationError({
                    'table': "The selected table does not belong to the specified restaurant."
                })
        else:
            status = data.get('status')
            if status and status not in ['Pending', 'In Progress', 'Completed']:
                raise serializers.ValidationError({
                    'status': "Invalid status value."
                })

        return data

    def create(self, validated_data):
        items_data = validated_data.pop('order_items', [])

        with transaction.atomic():
            try:
                order = Order.objects.create(**validated_data)

                for item_data in items_data:
                    selected_options = item_data.pop('selected_options', [])
                    order_item = OrderItem.objects.create(
                        order=order,
                        menu_item=item_data.get('menu_item'),
                        quantity=item_data.get('quantity', 1),
                        special_request=item_data.get('special_request', '')
                    )

                    if selected_options:
                        order_item.selected_options.set(selected_options)

                return order

            except Exception as e:
                raise serializers.ValidationError({'error': f'Failed to create order: {str(e)}'})
