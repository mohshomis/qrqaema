from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..models import Restaurant
from ..serializers import RestaurantProfileSerializer

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def complete_restaurant_profile(request, restaurant_id):
    """
    Complete or update a restaurant's profile after initial registration.
    Only the restaurant owner can update the profile.
    """
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    
    # Check if the user is the owner
    if restaurant.owner != request.user:
        return Response(
            {"error": "Only the restaurant owner can update the profile"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = RestaurantProfileSerializer(
        restaurant,
        data=request.data,
        partial=True
    )
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
