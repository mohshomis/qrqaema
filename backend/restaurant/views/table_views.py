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
            return [IsAuthenticated()]
        elif self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        restaurant_pk = self.kwargs.get('restaurant_pk')
        restaurant = get_object_or_404(Restaurant, pk=restaurant_pk)
        context['restaurant'] = restaurant
        return context

    def get_queryset(self):
        user = self.request.user
        restaurant_pk = self.kwargs.get('restaurant_pk')
        
        if user.is_superuser:
            queryset = Table.objects.all()
        elif user.is_authenticated:
            try:
                restaurant = Restaurant.objects.get(pk=restaurant_pk)
                queryset = Table.objects.filter(
                    restaurant=restaurant
                ).filter(
                    models.Q(restaurant__owner=user) | models.Q(restaurant__staff=user)
                )
            except Restaurant.DoesNotExist:
                queryset = Table.objects.none()
        else:
            queryset = Table.objects.none()

        return queryset

    def create(self, request, *args, **kwargs):
        restaurant_id = self.kwargs.get('restaurant_pk')
        table_number = request.data.get('number')
        capacity = request.data.get('capacity', 4)  # Default capacity if not provided

        # Ensure restaurant exists
        restaurant = get_object_or_404(Restaurant, pk=restaurant_id)

        # Validation: Ensure Table Number is Unique in Restaurant
        if Table.objects.filter(restaurant=restaurant, number=table_number).exists():
            return Response(
                {"error": "This table number already exists for this restaurant."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validation: Capacity Check
        if not (1 <= capacity <= 100):
            return Response(
                {"error": "Capacity must be between 1 and 100."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create the Table instance
            table = Table.objects.create(
                restaurant=restaurant,
                number=table_number,
                capacity=capacity
            )
            serializer = self.get_serializer(table)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": "Failed to create table due to an internal error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
