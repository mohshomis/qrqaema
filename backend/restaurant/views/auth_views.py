from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from textwrap import dedent
from authentication.tokens import account_activation_token
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from ..serializers import (
    RegistrationSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    UsernameRecoverySerializer
)

@api_view(['POST'])
def validate_user_data(request):
    """
    Validates the user data before creating an account.
    This includes checking for existing username and email.
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response({'error': 'اسم المستخدم موجود بالفعل.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response({'error': 'البريد الإلكتروني موجود بالفعل.'}, status=status.HTTP_400_BAD_REQUEST)

    # Optionally: Add password strength validation here
    if len(password) < 8:
        return Response({'error': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'message': 'Valid user data.'}, status=status.HTTP_200_OK)

class RegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        print("\n=== Registration Process Started ===")
        print("Incoming registration data:", request.data)
        
        serializer = RegistrationSerializer(data=request.data, context={'request': request})
        print("Serializer context:", serializer.context)

        try:
            if serializer.is_valid():
                print("Serializer validation passed")
                print("Validated data:", serializer.validated_data)
                
                try:
                    data = serializer.save()
                    print("Registration successful!")
                    print("Created user:", data['user'].username)
                    print("Created restaurant:", data['restaurant'].name)
                    return Response({
                        'message': 'Registration successful. Please check your email to activate your account.',
                        'user': data['user'].username,
                        'restaurant': data['restaurant'].name
                    }, status=status.HTTP_201_CREATED)
                except Exception as e:
                    print("Error during save operation:", str(e))
                    print("Error type:", type(e).__name__)
                    import traceback
                    print("Traceback:", traceback.format_exc())
                    return Response({
                        'error': 'Registration failed during save operation.',
                        'detail': str(e)
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                print("Serializer validation failed")
                print("Validation errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Unexpected error during registration:", str(e))
            print("Error type:", type(e).__name__)
            import traceback
            print("Traceback:", traceback.format_exc())
            return Response({
                'error': 'An unexpected error occurred during registration.',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and account_activation_token.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'message': 'Account activated successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Activation link is invalid!'}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Password reset link sent to your email.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = PasswordResetConfirmSerializer(data=request.data, context={'user': user, 'token': token})
            if serializer.is_valid():
                serializer.save()
                return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

class UsernameRecoveryView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UsernameRecoverySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Username sent to your email.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
