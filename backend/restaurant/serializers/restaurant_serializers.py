from rest_framework import serializers
from django.contrib.auth.models import User
from ..models import Restaurant, Category, Table, Menu
from ..utils.validators import validate_image_file
from .menu_serializers import MenuSerializer

class TableSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=False, write_only=True)

    class Meta:
        model = Table
        fields = ['id', 'restaurant', 'number', 'status', 'capacity']
        read_only_fields = ['id']

    def validate_number(self, value):
        restaurant = self.context.get('restaurant')
        if restaurant is None:
            raise serializers.ValidationError("Restaurant context is missing.")

        if Table.objects.filter(restaurant=restaurant, number=value).exists():
            raise serializers.ValidationError("This table number already exists in the restaurant.")
        return value

    def create(self, validated_data):
        restaurant = self.context.get('restaurant')
        if restaurant is None:
            raise serializers.ValidationError("Restaurant context is missing.")

        validated_data.pop('restaurant', None)
        try:
            table = Table.objects.create(restaurant=restaurant, **validated_data)
            return table
        except Exception as e:
            raise serializers.ValidationError("An error occurred while creating the table.")

class CategorySerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)
    menu = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Category
        fields = ['id', 'menu', 'name', 'description', 'image', 'image_url', 'order']
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
            'order': {'required': False}
        }

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

    def validate_image(self, value):
        return validate_image_file(value, max_size=10 * 1024 * 1024)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)

class RestaurantSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    logo_url = serializers.SerializerMethodField()
    background_image_url = serializers.SerializerMethodField()
    staff = serializers.SerializerMethodField()
    tables = TableSerializer(many=True, read_only=True)
    menus = MenuSerializer(many=True, read_only=True)
    
    class Meta:
        model = Restaurant
        fields = [
            'id',
            'name',
            'address',
            'phone_number',
            'owner',
            'logo',
            'logo_url',
            'background_image',
            'background_image_url',
            'staff',
            'country',
            'city',
            'postal_code',
            'currency',
            'number_of_employees',
            'facebook',
            'instagram',
            'payment_methods',
            'tags',
            'business_license',
            'tables',
            'menus',
            'default_language',
        ]
        extra_kwargs = {
            'owner': {'read_only': True},
            'logo': {'required': False, 'allow_null': True},
            'background_image': {'required': False, 'allow_null': True},
            'address': {'required': False},
            'phone_number': {'required': False},
            'country': {'required': False},
            'city': {'required': False},
            'postal_code': {'required': False},
            'currency': {'required': False},
            'number_of_employees': {'required': False},
            'facebook': {'required': False},
            'instagram': {'required': False},
            'payment_methods': {'required': False},
            'tags': {'required': False},
            'business_license': {'required': False},
            'default_language': {'required': False},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If this is a registration context, only name is required
        if self.context.get('registration', False):
            print("Initializing RestaurantSerializer in registration context")
            self.fields['name'].required = True
            # Make all other fields optional
            for field in self.fields:
                if field != 'name':
                    self.fields[field].required = False
            
            # Initialize empty values for required model fields
            self.fields['address'].default = ''
            self.fields['phone_number'].default = ''
            self.fields['country'].default = ''
            self.fields['city'].default = ''
            
            print("RestaurantSerializer fields configuration:", {
                field_name: {
                    'required': field.required,
                    'default': getattr(field, 'default', None)
                }
                for field_name, field in self.fields.items()
            })

    def create(self, validated_data):
        print("Creating restaurant with data:", validated_data)
        # Set default values for required fields if not provided
        if self.context.get('registration', False):
            validated_data.setdefault('address', '')
            validated_data.setdefault('phone_number', '')
            validated_data.setdefault('country', '')
            validated_data.setdefault('city', '')
            validated_data.setdefault('payment_methods', [])
            validated_data.setdefault('tags', [])
            print("Restaurant data after defaults:", validated_data)

        # Create the restaurant
        restaurant = super().create(validated_data)

        # Create a default menu in the restaurant's default language
        Menu.objects.create(
            restaurant=restaurant,
            name="Default Menu",
            language=restaurant.default_language,
            is_default=True
        )

        return restaurant

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo:
            return request.build_absolute_uri(obj.logo.url)
        return None

    def get_background_image_url(self, obj):
        request = self.context.get('request')
        if obj.background_image:
            return request.build_absolute_uri(obj.background_image.url)
        return None

    def get_staff(self, obj):
        from .auth_serializers import UserSerializer
        return UserSerializer(obj.staff.all(), many=True).data

    def validate_logo(self, value):
        return validate_image_file(value, max_size=10 * 1024 * 1024)

    def validate_background_image(self, value):
        return validate_image_file(value, max_size=10 * 1024 * 1024)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
