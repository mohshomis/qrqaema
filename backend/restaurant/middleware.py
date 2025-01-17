from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404
from .models import Restaurant  # Assuming you have a Restaurant model


from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404
from .models import Restaurant  # Import your Restaurant model

def owner_required(function):
    def wrap(request, *args, **kwargs):
        restaurant_id = kwargs.get('restaurant_id')  # Assuming the restaurant ID is passed in the URL
        
        # Fetch the restaurant object based on the restaurant_id in the URL
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        # Check if the user is an owner associated with this specific restaurant
        if restaurant.owners.filter(id=request.user.id).exists():
            return function(request, *args, **kwargs)
        else:
            return HttpResponseForbidden("You do not have permission to access this resource.")
    
    return wrap


def staff_required(function):
    def wrap(request, *args, **kwargs):
        if request.user.groups.filter(name='restaurant_staff').exists():
            return function(request, *args, **kwargs)
        else:
            return HttpResponseForbidden("You do not have permission to access this resource.")
    return wrap
