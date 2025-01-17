from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden
from django.contrib.auth.models import Group, User
from ..models import Restaurant
from ..serializers import RestaurantSerializer, RestaurantProfileSerializer
from .permissions import IsOwner, IsOwnerOrStaff

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.action in ['create', 'public_details']:
            return [AllowAny()]
        elif self.action in ['update_profile', 'add_staff', 'remove_staff']:
            return [IsAuthenticated(), IsOwner()]
        elif self.action in ['get_qr_codes']:
            return [IsAuthenticated(), IsOwnerOrStaff()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny], url_path='public-details')
    def public_details(self, request, pk=None):
        try:
            restaurant = get_object_or_404(Restaurant, id=pk)
            logo_url = request.build_absolute_uri(restaurant.logo.url) if restaurant.logo else None
            background_image_url = request.build_absolute_uri(restaurant.background_image.url) if restaurant.background_image else None

            public_data = {
                'name': restaurant.name,
                'logo_url': logo_url,
                'background_image_url': background_image_url,
            }
            return Response(public_data, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsOwnerOrStaff])
    def get_qr_codes(self, request, pk=None):
        restaurant = self.get_object()
        qr_codes = restaurant.generate_all_qr_codes()
        return Response({'qr_codes': qr_codes, 'total_tables': restaurant.tables})

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def retrieve_profile(self, request, pk=None):
        restaurant = self.get_object()
        serializer = self.get_serializer(restaurant)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsOwner])
    def update_profile(self, request, pk=None):
        try:
            restaurant = self.get_object()
            serializer = RestaurantProfileSerializer(restaurant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": "An unexpected error occurred while updating the profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOwner], url_path='add-staff')
    def add_staff(self, request, pk=None):
        try:
            restaurant = self.get_object()
            staff_usernames = request.data.get('staff', [])
            if not staff_usernames:
                return Response({'error': 'No staff usernames provided.'}, status=status.HTTP_400_BAD_REQUEST)

            staff_group, _ = Group.objects.get_or_create(name='restaurant_staff')
            for username in staff_usernames:
                user = get_object_or_404(User, username=username)
                restaurant.staff.add(user)
                if not user.groups.filter(name='restaurant_staff').exists():
                    user.groups.add(staff_group)

            return Response({'message': 'Staff added successfully.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'One or more users not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated, IsOwner], url_path='remove-staff')
    def remove_staff(self, request, pk=None):
        try:
            restaurant = self.get_object()
            staff_usernames = request.data.get('staff', [])
            if not staff_usernames:
                return Response({'error': 'No staff usernames provided.'}, status=status.HTTP_400_BAD_REQUEST)

            staff_group = Group.objects.get(name='restaurant_staff')
            for username in staff_usernames:
                user = get_object_or_404(User, username=username)
                restaurant.staff.remove(user)
                
                if not Restaurant.objects.filter(staff=user).exists():
                    user.groups.remove(staff_group)
                    user.delete()

            return Response({'message': 'Staff removed and users deleted successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
