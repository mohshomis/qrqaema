# restaurant_app/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter
from .views import (
    RestaurantViewSet, MenuItemViewSet, OrderViewSet, CategoryViewSet,
    RegistrationView, UsernameRecoveryView, validate_user_data, ActivateAccountView,
    PasswordResetView, PasswordResetConfirmView, HelpRequestViewSet,
    TableViewSet
)
from .views.menu_views import MenuViewSet
from rest_framework_simplejwt.views import TokenRefreshView

# Create the main router and register viewsets
router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurants')
router.register(r'menus', MenuViewSet, basename='menus')
router.register(r'menu-items', MenuItemViewSet, basename='menu-items')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'help-requests', HelpRequestViewSet, basename='help-requests')

# Create a nested router for tables under restaurants
restaurants_router = NestedDefaultRouter(router, r'restaurants', lookup='restaurant')
restaurants_router.register(r'tables', TableViewSet, basename='restaurant-tables')

# Create a nested router for menus under restaurants
restaurants_router.register(r'menus', MenuViewSet, basename='restaurant-menus')

urlpatterns = [
# Menu-specific endpoints (moved to top to take precedence)
    path(
        'restaurants/<uuid:restaurant_id>/menus/',
        MenuViewSet.as_view({'get': 'menus_for_restaurant'}),
        name='restaurant_menus'
    ),
    path(
        'menus/<uuid:pk>/',
        MenuViewSet.as_view({'get': 'retrieve'}),
        name='menu-detail'
    ),
    path(
        'menus/<uuid:pk>/set-default/',
        MenuViewSet.as_view({'post': 'set_default'}),
        name='set_default_menu'
    ),

    # Add explicit path for add_table
    path('restaurants/<uuid:restaurant_id>/add_table/',
         TableViewSet.as_view({'post': 'create'}),
         name='restaurant-add-table'),
         
    # Include the main router URLs
    path('', include(router.urls)),

    # Include the nested router URLs for tables and menus
    path('', include(restaurants_router.urls)),
    
    # Custom path for menu item details with restaurantId and itemId using UUIDs
    path(
        'restaurants/<uuid:restaurantId>/menu-items/<int:itemId>/',
        MenuItemViewSet.as_view({'get': 'retrieve_item_for_restaurant'}),
        name='retrieve_item_for_restaurant'
    ),

    # Registration-related endpoints
    path('register/', RegistrationView.as_view(), name='register'),
    path('validate-user/', validate_user_data, name='validate_user'),  # Validation endpoint

    # Category-based menu items using UUIDs
    path(
        'categories/menu-items-by-category/<uuid:category_id>/',
        CategoryViewSet.as_view({'get': 'menu_items_by_category'}),
        name='menu_items_by_category'
    ),

    # Public restaurant details endpoint (for unauthenticated users) using UUIDs
    path(
        'restaurants/<uuid:pk>/public-details/',
        RestaurantViewSet.as_view({'get': 'public_details'}),
        name='restaurant_public_details'
    ),

    # Profile management endpoints using UUIDs
    path(
        'restaurants/<uuid:pk>/profile/',
        RestaurantViewSet.as_view({'get': 'retrieve_profile'}),
        name='restaurant_profile'
    ),
    path(
        'restaurants/<uuid:pk>/update-profile/',
        RestaurantViewSet.as_view({'patch': 'update_profile'}),
        name='restaurant_update_profile'
    ),

    # Staff management endpoints using UUIDs
    path(
        'restaurants/<uuid:pk>/add-staff/',
        RestaurantViewSet.as_view({'post': 'add_staff'}),
        name='add_staff'
    ),
    path(
        'restaurants/<uuid:pk>/remove-staff/',
        RestaurantViewSet.as_view({'delete': 'remove_staff'}),
        name='remove_staff'
    ),

    # Order status endpoint
    path(
        'orders/status/',
        OrderViewSet.as_view({'get': 'get_order_status'}),
        name='order_status'
    ),

    # Category retrieval for specific restaurant using UUIDs
    path(
        'restaurants/<uuid:restaurantId>/categories/',
        CategoryViewSet.as_view({'get': 'categories_for_restaurant'}),
        name='categories_for_restaurant'
    ),


    # Activation and Password Reset URLs
    path(
        'activate/<uidb64>/<token>/',
        ActivateAccountView.as_view(),
        name='activate'
    ),
    path(
        'password-reset/',
        PasswordResetView.as_view(),
        name='password_reset'
    ),
    path(
        'password-reset-confirm/<uidb64>/<token>/',
        PasswordResetConfirmView.as_view(),
        name='password_reset_confirm'
    ),
    path(
        'username-recovery/',
        UsernameRecoveryView.as_view(),
        name='username_recovery'
    ),
]
