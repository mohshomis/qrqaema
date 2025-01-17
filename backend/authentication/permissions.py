from rest_framework.permissions import BasePermission, IsAuthenticated

class IsAuthenticatedOrPublicPath(BasePermission):
    def has_permission(self, request, view):
        # Check if this is a public path (set by middleware)
        if getattr(request, 'is_public_path', False):
            return True
        # Otherwise, require authentication
        return bool(request.user and request.user.is_authenticated)
