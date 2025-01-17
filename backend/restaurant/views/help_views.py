from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from ..models import HelpRequest
from ..serializers import HelpRequestSerializer
from .permissions import IsOwnerOrStaff

class HelpRequestViewSet(viewsets.ModelViewSet):
    queryset = HelpRequest.objects.all().order_by('-created_at')
    serializer_class = HelpRequestSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'list']:
            return [IsAuthenticated(), IsOwnerOrStaff()]
        elif self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            queryset = queryset.filter(restaurant__id=restaurant_id)
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_help_requests(self, request):
        user = request.user
        if user.groups.filter(name='restaurant_owners').exists():
            queryset = HelpRequest.objects.filter(restaurant__owner=user)
        elif user.groups.filter(name='restaurant_staff').exists():
            queryset = HelpRequest.objects.filter(restaurant__staff=user)
        else:
            queryset = HelpRequest.objects.none()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # If user is authenticated, associate the help request with them
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        # Only allow updating status and response fields
        instance = self.get_object()
        if instance.restaurant.owner == self.request.user or instance.restaurant.staff.filter(id=self.request.user.id).exists():
            serializer.save()
        else:
            raise PermissionDenied("You don't have permission to update this help request.")
