from rest_framework import serializers
from ..models import HelpRequest, Table

class HelpRequestSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())

    class Meta:
        model = HelpRequest
        fields = [
            'id',
            'restaurant',
            'table',
            'user',
            'description',
            'status',
            'response',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context.get('request').user
        if user.is_authenticated:
            validated_data['user'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Only allow status and response to be updated
        instance.status = validated_data.get('status', instance.status)
        instance.response = validated_data.get('response', instance.response)
        instance.save()
        return instance
