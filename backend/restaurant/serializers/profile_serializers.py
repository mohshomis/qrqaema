from rest_framework import serializers
from ..models import Restaurant

class RestaurantProfileSerializer(serializers.ModelSerializer):
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
            'profile_completed'
        ]
        read_only_fields = ['profile_completed']

    def validate(self, data):
        # Get instance data for partial updates
        instance_data = {
            field: getattr(self.instance, field)
            for field in ['address', 'phone_number', 'country', 'city', 'postal_code']
            if self.instance
        }
        
        # Merge instance data with update data
        merged_data = {**instance_data, **data}
        
        # Check if all required fields are provided
        required_fields = ['address', 'phone_number', 'country', 'city', 'postal_code']
        missing_fields = [field for field in required_fields if not merged_data.get(field)]
        
        if missing_fields:
            raise serializers.ValidationError({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            })

        # Phone number validation
        phone_number = merged_data.get('phone_number')
        if phone_number and not phone_number.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise serializers.ValidationError({
                'phone_number': 'Invalid phone number format'
            })

        # Postal code validation
        postal_code = merged_data.get('postal_code')
        if postal_code and not any(c.isalnum() for c in postal_code):
            raise serializers.ValidationError({
                'postal_code': 'Invalid postal code format'
            })

        # Set profile_completed to True if all required fields are present
        data['profile_completed'] = True
        return data

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        return instance
