from rest_framework import serializers
from ..models import Restaurant

class RestaurantProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for updating restaurant profile after initial registration.
    All fields are optional since they can be filled in later.
    """
    class Meta:
        model = Restaurant
        fields = [
            'address',
            'phone_number',
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
            'logo',
            'background_image',
        ]
        extra_kwargs = {
            field: {'required': False} for field in fields
        }
