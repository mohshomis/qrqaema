from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from ..models import Category, MenuItem, Restaurant
from ..serializers import CategorySerializer, MenuItemSerializer
from .permissions import IsOwnerOrStaff

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['categories_for_restaurant', 'menu_items_by_category']:
            return [AllowAny()]
        return [IsAuthenticated(), IsOwnerOrStaff()]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        if not restaurant_id:
            raise serializers.ValidationError({'restaurant': 'Restaurant ID is required.'})
        
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        if restaurant.owner != self.request.user:
            raise PermissionDenied('Only the owner can add categories to this restaurant.')

        serializer.save(restaurant=restaurant)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Category.objects.filter(restaurant__owner=user)
        return Category.objects.none()

    @action(detail=False, methods=['get'], url_path=r'menu-items-by-category/(?P<category_id>[0-9a-f-]+)', permission_classes=[AllowAny])
    def menu_items_by_category(self, request, category_id=None):
        category = get_object_or_404(Category, id=category_id)
        menu_items = MenuItem.objects.filter(category=category)
        serializer = MenuItemSerializer(menu_items, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path=r'restaurants/(?P<restaurantId>[0-9a-f-]+)/categories', permission_classes=[AllowAny])
    def categories_for_restaurant(self, request, restaurantId=None):
        try:
            categories = Category.objects.filter(restaurant__id=restaurantId)
            serializer = self.get_serializer(categories, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy', 'partial_update']:
            return [IsAuthenticated()]
        if self.action in ['list', 'retrieve', 'customer_menu']:
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path=r'menu-items-by-category/(?P<category_id>[0-9a-f-]+)', permission_classes=[AllowAny])
    def menu_items_by_category(self, request, category_id=None):
        category = get_object_or_404(Category, id=category_id)
        menu_items = MenuItem.objects.filter(category=category)
        serializer = self.get_serializer(menu_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path=r'restaurants/(?P<restaurantId>[0-9a-f-]+)/menu-items/(?P<itemId>[0-9a-f-]+)')
    def retrieve_item_for_restaurant(self, request, restaurantId=None, itemId=None):
        try:
            restaurant = Restaurant.objects.get(id=restaurantId)
            menu_item = MenuItem.objects.get(id=itemId, restaurant=restaurant)
            serializer = self.get_serializer(menu_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Menu item not found for this restaurant'}, status=status.HTTP_404_NOT_FOUND)

    def get_queryset(self):
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return MenuItem.objects.all()

        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            if self.request.user.is_authenticated:
                if (self.request.user.groups.filter(name='restaurant_owners').exists() or 
                    self.request.user.groups.filter(name='restaurant_staff').exists()):
                    return MenuItem.objects.filter(restaurant__id=restaurant_id)
            return MenuItem.objects.filter(restaurant__id=restaurant_id)
        return MenuItem.objects.none()

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        if not restaurant_id:
            raise serializers.ValidationError({"restaurant": "This field is required."})

        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        if restaurant.owner != self.request.user and not restaurant.staff.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You don't have permission to add items to this restaurant.")

        menu_item = serializer.save(restaurant=restaurant)
