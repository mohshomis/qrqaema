from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden
from django.db import models
from ..models import Table, Restaurant
from ..serializers import TableSerializer
from .permissions import IsOwnerOrStaff

class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'download_qr_code']:
            return [IsAuthenticated(), IsOwnerOrStaff()]
        elif self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        restaurant_id = self.kwargs.get('restaurant_id')
        restaurant = get_object_or_404(Restaurant, pk=restaurant_id)
        context['restaurant'] = restaurant
        return context

    def get_queryset(self):
        user = self.request.user
        restaurant_id = self.kwargs.get('restaurant_id')
        table_number = self.request.query_params.get('table_number')
        
        try:
            restaurant = Restaurant.objects.get(pk=restaurant_id)
            queryset = Table.objects.filter(restaurant=restaurant)
            
            # If table_number is provided, filter by it
            if table_number is not None:
                try:
                    table_number = int(table_number)
                    queryset = queryset.filter(number=table_number)
                except ValueError:
                    return Table.objects.none()
            
            # Apply user-based filtering only for authenticated endpoints
            if self.action not in ['list', 'retrieve']:
                if user.is_authenticated and not user.is_superuser:
                    queryset = queryset.filter(
                        models.Q(restaurant__owner=user) | models.Q(restaurant__staff=user)
                    )
                elif not user.is_superuser:
                    return Table.objects.none()
                    
            return queryset
            
        except Restaurant.DoesNotExist:
            return Table.objects.none()

    def create(self, request, *args, **kwargs):
        try:
            restaurant_id = self.kwargs.get('restaurant_id')
            restaurant = get_object_or_404(Restaurant, pk=restaurant_id)
            
            # Get the highest table number for this restaurant
            highest_table = Table.objects.filter(restaurant=restaurant).order_by('-number').first()
            next_number = (highest_table.number + 1) if highest_table else 1
            
            # Prepare data with auto-generated number and restaurant
            data = {
                'number': next_number,
                'capacity': request.data.get('capacity', 4),
                'restaurant': restaurant.id
            }
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            table = serializer.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating table: {str(e)}")  # Add logging
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'], url_path='download_qr_code', permission_classes=[IsAuthenticated])
    def download_qr_code(self, request, restaurant_pk=None, pk=None):
        if not restaurant_pk:
            return Response({'error': 'Restaurant ID is required to download QR codes.'}, status=status.HTTP_400_BAD_REQUEST)
        
        restaurant = get_object_or_404(Restaurant, pk=restaurant_pk)
        user = request.user

        if not (restaurant.owner == user or restaurant.staff.filter(id=user.id).exists()):
            return Response({'error': 'You are not allowed to download QR codes for this restaurant.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            table = get_object_or_404(Table, pk=pk, restaurant=restaurant)
            qr_file_path = restaurant.generate_qr_code(table.id)
            return Response({'qr_code_path': qr_file_path}, status=status.HTTP_200_OK)

        except Table.DoesNotExist:
            return Response({'error': 'Table does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='number')
    def get_number(self, request, restaurant_pk=None, pk=None):
        try:
            table = self.get_object()
            return Response({'number': table.number}, status=status.HTTP_200_OK)
        except Table.DoesNotExist:
            return Response({'error': 'Table not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
