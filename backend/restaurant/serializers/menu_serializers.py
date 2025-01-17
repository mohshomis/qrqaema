from rest_framework import serializers
import json
from ..models import MenuItem, MenuItemOption, MenuItemBooleanOption, Restaurant, Category, Menu
from ..utils.validators import validate_image_file

class MenuItemBooleanOptionSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = MenuItemBooleanOption
        fields = ['id', 'name', 'price_modifier']
        read_only_fields = ['id']

class MenuItemOptionSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    choices = MenuItemBooleanOptionSerializer(many=True, required=False)

    class Meta:
        model = MenuItemOption
        fields = ['id', 'name', 'choices']
        read_only_fields = ['id']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        option = MenuItemOption.objects.create(**validated_data)
        for choice_data in choices_data:
            MenuItemBooleanOption.objects.create(option_category=option, **choice_data)
        return option

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if choices_data is not None:
            instance.choices.all().delete()
            for choice_data in choices_data:
                MenuItemBooleanOption.objects.create(option_category=instance, **choice_data)

        return instance

class MenuItemSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    menu = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all(), required=False)
    options = MenuItemOptionSerializer(many=True, required=False)
    image_url = serializers.SerializerMethodField()
    is_available = serializers.BooleanField(required=False, default=True)
    
    class Meta:
        model = MenuItem
        fields = [
            'id',
            'restaurant',
            'menu',
            'category',
            'name',
            'description',
            'price',
            'image',
            'image_url',
            'options',
            'is_available',
            'order',
        ]
        read_only_fields = ['id', 'image_url']
    
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None
    
    def validate_image(self, value):
        return validate_image_file(value, max_size=10 * 1024 * 1024)
    
    def to_internal_value(self, data):
        if hasattr(data, 'lists'):
            data = {key: value[0] for key, value in data.lists()}
        
        if 'options' in data and isinstance(data['options'], str):
            try:
                options_parsed = json.loads(data['options'])
                data = data.copy()
                data['options'] = options_parsed
            except json.JSONDecodeError:
                raise serializers.ValidationError({"options": "Invalid JSON format for options."})
        
        if 'options' in data and isinstance(data['options'], list):
            if len(data['options']) > 0 and isinstance(data['options'][0], list):
                data['options'] = data['options'][0]
    
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        menu_item = MenuItem.objects.create(**validated_data)

        for option_data in options_data:
            choices_data = option_data.pop('choices', [])
            option_category = MenuItemOption.objects.create(menu_item=menu_item, **option_data)

            for choice_data in choices_data:
                MenuItemBooleanOption.objects.create(option_category=option_category, **choice_data)

        return menu_item

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            instance.options.all().delete()
            
            for option_data in options_data:
                choices_data = option_data.pop('choices', [])
                option_category = MenuItemOption.objects.create(menu_item=instance, **option_data)

                for choice_data in choices_data:
                    MenuItemBooleanOption.objects.create(option_category=option_category, **choice_data)

        return instance

class MenuSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    categories = serializers.SerializerMethodField()
    menu_items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Menu
        fields = [
            'id',
            'restaurant',
            'name',
            'language',
            'is_default',
            'categories',
            'menu_items',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_categories(self, obj):
        from .restaurant_serializers import CategorySerializer
        categories = obj.categories.all().order_by('order', 'name')
        return CategorySerializer(categories, many=True, context=self.context).data

    def validate(self, data):
        # If setting this menu as default, ensure it's the only default menu for this restaurant
        if data.get('is_default', False):
            existing_default = Menu.objects.filter(
                restaurant=data['restaurant'],
                is_default=True
            ).exclude(id=self.instance.id if self.instance else None).first()
            
            if existing_default:
                existing_default.is_default = False
                existing_default.save()

        return data
