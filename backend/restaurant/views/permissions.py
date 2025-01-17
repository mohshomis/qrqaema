from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='restaurant_owners').exists()

class IsOwnerOrStaff(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'restaurant'):
            return obj.restaurant.owner == request.user or obj.restaurant.staff.filter(id=request.user.id).exists()
        # If the object is a Restaurant itself
        return obj.owner == request.user or obj.staff.filter(id=request.user.id).exists()
