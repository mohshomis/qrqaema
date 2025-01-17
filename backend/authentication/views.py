# serializers.py

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from restaurant.models import Restaurant
from rest_framework.exceptions import AuthenticationFailed
from django.core.exceptions import MultipleObjectsReturned
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Debugging: Print user details
        print(f"User attempting login: {user.username} (ID: {user.id})")
        print(f"Is superuser: {user.is_superuser}")

        # Prevent superusers from logging into the frontend
        if user.is_superuser:
            print("Login attempt by superuser - Raising AuthenticationFailed")
            raise AuthenticationFailed('Superusers cannot log into the frontend.')

        # Check if the user is the owner of any restaurant
        is_owner = Restaurant.objects.filter(owner=user).exists()
        # Check if the user is a staff member
        is_staff = user.groups.filter(name='restaurant_staff').exists()

        print(f"Is user a restaurant owner: {is_owner}")
        print(f"Is user a staff member: {is_staff}")

        # Allow login if the user is either an owner or a staff member
        if not (is_owner or is_staff):
            print("Login attempt by non-owner and non-staff - Raising AuthenticationFailed")
            raise AuthenticationFailed('Only restaurant owners and staff can log into the system.')

        token = super().get_token(user)

        # Add custom claims
        token['is_owner'] = is_owner
        token['is_staff'] = is_staff

        # Debugging: Print assigned claims
        print(f"Token claims added: is_owner = {is_owner}, is_staff = {is_staff}")

        # Add the restaurant ID
        try:
            if is_owner:
                # If the user is an owner, fetch the restaurant they own
                restaurant = Restaurant.objects.get(owner=user)
                token['restaurant_id'] = str(restaurant.id)  # Convert UUID to string
                print(f"Restaurant found for owner {user.username}: {restaurant.name} (ID: {restaurant.id})")
            elif is_staff:
                # If the user is staff, fetch the restaurant they belong to
                # Assuming a staff member belongs to only one restaurant
                restaurant = Restaurant.objects.get(staff=user)
                token['restaurant_id'] = str(restaurant.id)  # Convert UUID to string
                print(f"Restaurant found for staff {user.username}: {restaurant.name} (ID: {restaurant.id})")
            else:
                token['restaurant_id'] = None
                print(f"No restaurant found for user {user.username}")
        except Restaurant.DoesNotExist:
            token['restaurant_id'] = None
            print(f"No restaurant associated with user {user.username}")
        except MultipleObjectsReturned:
            print(f"Multiple restaurants found for user {user.username}, this should not happen.")
            raise AuthenticationFailed('Multiple restaurants found for this user. Please contact support.')
        except Exception as e:
            # Catch any other exception and print the error
            print(f"Unexpected error: {str(e)}")
            raise AuthenticationFailed(f'An unexpected error occurred: {str(e)}')

        # Debugging: Final token before returning
        print(f"Final token for user {user.username}: {token}")
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
