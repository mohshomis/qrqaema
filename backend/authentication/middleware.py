from django.conf import settings
import re
from rest_framework.permissions import AllowAny

class PublicPathMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # Compile the public path patterns
        self.public_paths = [
            re.compile(pattern)
            for pattern in getattr(settings, 'REST_FRAMEWORK', {}).get('PUBLIC_PATHS', [])
        ]

    def __call__(self, request):
        # Check if the path matches any public path pattern
        path = request.path_info
        for pattern in self.public_paths:
            if pattern.search(path):
                # Set a flag on the request to indicate this is a public path
                request.is_public_path = True
                break
        else:
            request.is_public_path = False

        response = self.get_response(request)
        return response
