from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from authentication.views import CustomTokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache

# This view will serve the React index.html for frontend routes
index_view = never_cache(TemplateView.as_view(template_name='index.html'))

urlpatterns = [
    # Admin route
    path('admin/', admin.site.urls),

    # API routes for restaurant (include the routes from restaurant/urls.py)
    path('api/', include('restaurant.urls')),
     # Analysis routes
    path('analysis/', include('analysis.urls', namespace='analysis')),


    # Authentication routes for JWT
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # For browsing the API in the browser with session authentication
    path('api-auth/', include('rest_framework.urls')), 
]

# Serving media files in development (e.g. uploaded images)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all route to serve the React app for non-API requests (including frontend routes)
urlpatterns += [
    re_path(r'^(?!api/).*$', index_view, name='index'),  # All paths not starting with 'api/'
]
