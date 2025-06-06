from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from ..models import Category, MenuItem, Restaurant, Menu
from ..serializers import CategorySerializer, MenuItemSerializer
from ..serializers.menu_serializers import MenuSerializer
from ..serializers.restaurant_serializers import MenuBasicSerializer
from .permissions import IsOwnerOrStaff
import logging

logger = logging.getLogger(__name__)

class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        logger.info(f"Checking permissions for action: {self.action}")
        if self.action in ['list', 'retrieve', 'menus_for_restaurant']:
            logger.info("Using AllowAny permission")
            return [AllowAny()]
        logger.info("Using IsAuthenticated and IsOwnerOrStaff permissions")
        return [IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        logger.info(f"Getting queryset for action: {self.action}")
        if self.action in ['list', 'retrieve']:
            restaurant_id = self.request.query_params.get('restaurant')
            if restaurant_id:
                logger.info(f"Filtering menus for restaurant: {restaurant_id}")
                return Menu.objects.filter(restaurant__id=restaurant_id)
            logger.info("No restaurant ID provided, returning empty queryset")
            return Menu.objects.none()
        logger.info("Returning all menus")
        return Menu.objects.all()

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        logger.info(f"Creating menu with data: {self.request.data}")
        
        if not restaurant_id:
            logger.error("Restaurant ID missing in request data")
            raise serializers.ValidationError({'restaurant': 'Restaurant ID is required.'})
        
        try:
            restaurant = get_object_or_404(Restaurant, id=restaurant_id)
            logger.info(f"Found restaurant: {restaurant.id} - {restaurant.name}")
            
            if restaurant.owner != self.request.user and not restaurant.staff.filter(id=self.request.user.id).exists():
                logger.warning(f"Permission denied. User {self.request.user.id} is not owner or staff")
                raise PermissionDenied('Only the owner or staff can add menus to this restaurant.')

            menu = serializer.save(restaurant=restaurant)
            logger.info(f"Successfully created menu: {menu.id} - {menu.name}")
            return menu
        except Exception as e:
            logger.error(f"Error creating menu: {str(e)}")
            raise

    @action(detail=False, methods=['get'], url_path=r'restaurants/(?P<restaurant_id>[0-9a-f-]+)/menus')
    def menus_for_restaurant(self, request, restaurant_id=None):
        try:
            logger.info(f"Fetching menus for restaurant: {restaurant_id}")
            
            # Get the restaurant first
            restaurant = get_object_or_404(Restaurant, id=restaurant_id)
            logger.info(f"Found restaurant: {restaurant.name}")
            
            # Get menus with related data
            menus = Menu.objects.filter(restaurant=restaurant).prefetch_related(
                'categories',
                'menu_items'
            ).select_related('restaurant')
            logger.info(f"Found {menus.count()} menus")
            
            # Get available languages
            available_languages = Menu.get_available_languages(restaurant)
            logger.info(f"Available languages: {available_languages}")
            
            # Create serializer with request context
            serializer = self.get_serializer(
                menus, 
                many=True, 
                context={'request': request}
            )
            serialized_data = serializer.data
            
            
            # Return menus and available languages
            response_data = {
                'menus': serialized_data,
                'available_languages': available_languages,
                'default_language': restaurant.default_language
            } if serialized_data else {
                'menus': [],
                'available_languages': [],
                'default_language': restaurant.default_language
            }
            
            return Response(response_data)
        except Exception as e:
            logger.error(f"Error fetching menus: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        menu = self.get_object()
        if menu.restaurant.owner != request.user and not menu.restaurant.staff.filter(id=request.user.id).exists():
            raise PermissionDenied('Only the owner or staff can set the default menu.')
        
        # Set all other menus as non-default
        Menu.objects.filter(restaurant=menu.restaurant).update(is_default=False)
        menu.is_default = True
        menu.save()
        
        serializer = self.get_serializer(menu)
        return Response(serializer.data)

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
        menu_id = self.request.data.get('menu')
        
        if not restaurant_id:
            raise serializers.ValidationError({'restaurant': 'Restaurant ID is required.'})
        if not menu_id:
            raise serializers.ValidationError({'menu': 'Menu ID is required.'})
        
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        menu = get_object_or_404(Menu, id=menu_id, restaurant=restaurant)
        
        if restaurant.owner != self.request.user and not restaurant.staff.filter(id=self.request.user.id).exists():
            raise PermissionDenied('Only the owner or staff can add categories to this restaurant.')

        serializer.save(restaurant=restaurant, menu=menu)

    def get_queryset(self):
        if self.action == 'destroy':
            return Category.objects.all()
        menu_id = self.request.query_params.get('menu')
        if menu_id:
            return Category.objects.filter(menu__id=menu_id)
        return Category.objects.none()

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            logger.info(f"Deleting category: {instance.id}")
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting category: {str(e)}")
            return Response(
                {"error": f"Failed to delete category: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path=r'menu-items-by-category/(?P<category_id>[0-9a-f-]+)', permission_classes=[AllowAny])
    def menu_items_by_category(self, request, category_id=None):
        category = get_object_or_404(Category, id=category_id)
        menu_items = MenuItem.objects.filter(category=category)
        serializer = MenuItemSerializer(menu_items, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path=r'restaurants/(?P<restaurantId>[0-9a-f-]+)/categories', permission_classes=[AllowAny])
    def categories_for_restaurant(self, request, restaurantId=None):
        try:
            menu_id = request.query_params.get('menu')
            logger.info(f"Getting categories for restaurant {restaurantId} and menu {menu_id}")
            
            if not menu_id:
                return Response({"error": "Menu ID is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                menu = Menu.objects.get(id=menu_id, restaurant__id=restaurantId)
                logger.info(f"Found menu: {menu.name} ({menu.language})")
            except Menu.DoesNotExist:
                logger.error(f"Menu not found: {menu_id}")
                return Response({"error": "Menu not found."}, status=status.HTTP_404_NOT_FOUND)

            try:
                categories = Category.objects.filter(menu=menu).select_related(
                    'menu',
                    'menu__restaurant',
                    'restaurant'
                ).prefetch_related(
                    'menu_items',
                    'menu_items__options',
                    'menu_items__options__choices'
                )
                logger.info(f"Found {categories.count()} categories")
            except Exception as e:
                logger.error(f"Error fetching categories: {str(e)}")
                raise

            try:
                # Serialize categories with menu details
                category_serializer = self.get_serializer(
                    categories, 
                    many=True,
                    context={'request': self.request}
                )
                menu_serializer = MenuBasicSerializer(menu)
                
                response_data = {
                    'categories': category_serializer.data,
                    'menu': menu_serializer.data
                }
                logger.info("Successfully serialized response data")
                
                return Response(response_data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Error serializing data: {str(e)}")
                raise

        except Exception as e:
            logger.error(f"Unexpected error in categories_for_restaurant: {str(e)}")
            return Response(
                {"error": f"An unexpected error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        logger.info(f"MenuItemViewSet.get_permissions called for action: {self.action}")
        if self.action in ['create', 'update', 'destroy', 'partial_update']:
            logger.info("Requiring authentication and owner/staff permissions")
            return [IsAuthenticated(), IsOwnerOrStaff()]
        if self.action in ['list', 'retrieve', 'customer_menu', 'menu_items_by_category']:
            logger.info("Allowing public access")
            return [AllowAny()]
        logger.info("Using default permissions")
        return super().get_permissions()

    def perform_destroy(self, instance):
        logger.info(f"Performing destroy on menu item: {instance.id}")
        if instance.restaurant.owner != self.request.user and not instance.restaurant.staff.filter(id=self.request.user.id).exists():
            logger.warning(f"Permission denied for user {self.request.user.id}")
            raise PermissionDenied("You don't have permission to delete items from this restaurant.")
        super().perform_destroy(instance)

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
        logger.info("MenuItemViewSet.get_queryset called")
        logger.info(f"Action: {self.action}")
        
        if self.action == 'destroy':
            return MenuItem.objects.all()
            
        queryset = MenuItem.objects.all()
        
        restaurant_id = self.request.query_params.get('restaurant')
        menu_id = self.request.query_params.get('menu')
        category_id = self.request.query_params.get('category')
        
        logger.info(f"Filtering params - restaurant: {restaurant_id}, menu: {menu_id}, category: {category_id}")
        
        if restaurant_id:
            queryset = queryset.filter(restaurant__id=restaurant_id)
        if menu_id:
            queryset = queryset.filter(menu__id=menu_id)
        if category_id:
            queryset = queryset.filter(category__id=category_id)
            
        result = queryset if (restaurant_id or menu_id or category_id) else MenuItem.objects.none()
        logger.info(f"Returning {result.count()} menu items")
        return result

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            logger.info(f"Deleting menu item: {instance.id}")
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting menu item: {str(e)}")
            return Response(
                {"error": f"Failed to delete menu item: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        menu_id = self.request.data.get('menu')
        
        if not restaurant_id:
            raise serializers.ValidationError({"restaurant": "This field is required."})
        if not menu_id:
            raise serializers.ValidationError({"menu": "This field is required."})

        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        menu = get_object_or_404(Menu, id=menu_id, restaurant=restaurant)
        
        if restaurant.owner != self.request.user and not restaurant.staff.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You don't have permission to add items to this restaurant.")

        serializer.save(restaurant=restaurant, menu=menu)
