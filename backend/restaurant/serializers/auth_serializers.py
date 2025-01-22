from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.conf import settings
from textwrap import dedent
from django.db import transaction
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from authentication.tokens import account_activation_token
from ..models import Restaurant
from .restaurant_serializers import RestaurantSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError("No active user associated with this email.")
        return value

    def save(self):
        request = self.context.get('request')
        email = self.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            token = PasswordResetTokenGenerator().make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_reset_path = f"/password-reset-confirm/{uid}/{token}/"
            reset_link = f"{settings.FRONTEND_URL}{frontend_reset_path}"

            subject = 'Password Reset Request - QrQaema'
            message = dedent(f"""
                Hi {user.username},

                We received a request to reset your password for your QrQaema account. You can reset your password by clicking the link below:

                {reset_link}

                If you did not request a password reset, no action is required. Your password will remain the same, and you can safely ignore this email.

                For any assistance, feel free to reach out to our support team at {settings.SUPPORT_EMAIL}.

                Best regards,
                QrQaema Team
                
                ---

                This email was sent to {user.email}. If this wasn't you, please let us know immediately.
            """)

            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Passwords do not match."})

        try:
            validate_password(attrs.get('new_password'))
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"new_password": e.messages})

        return attrs

    def save(self):
        user = self.context.get('user')
        user.set_password(self.validated_data.get('new_password'))
        user.save()

class UsernameRecoverySerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError("No active user associated with this email.")
        return value

    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)

        subject = 'Username Recovery - QrQaema'
        message = dedent(f"""
            Hi {user.username},

            You recently requested to recover the username associated with your QrQaema account.

            Your username is: {user.username}

            If you did not request this, please ignore this email. Your account remains secure, and no further action is needed.

            For any assistance, feel free to reach out to our support team at {settings.SUPPORT_EMAIL}.

            Best regards,
            QrQaema Team
            
            ---

            This email was sent to {user.email}. If this wasn't you, please let us know immediately.
        """)
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

class RegistrationSerializer(serializers.Serializer):
    user = UserSerializer()
    restaurant = RestaurantSerializer()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Create a new instance of RestaurantSerializer with the correct context
        self.fields['restaurant'] = RestaurantSerializer(
            context={'registration': True, 'request': self.context.get('request')}
        )
        print("RegistrationSerializer initialized with context:", self.context)

    def create(self, validated_data):
        print("\n=== Starting RegistrationSerializer Create ===")
        if 'request' not in self.context:
            print("Error: 'request' missing from context")
            raise KeyError("'request' is missing from serializer context.")

        with transaction.atomic():
            print("Starting transaction")
            
            # User Creation
            print("Extracting user data")
            user_data = validated_data.pop('user')
            print("User data:", user_data)
            
            try:
                print("Creating user")
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data.get('email'),
                    password=user_data['password'],
                    is_active=False
                )
                print("User created successfully:", user.username)
            except Exception as user_creation_error:
                print("Error creating user:", str(user_creation_error))
                print("Error type:", type(user_creation_error).__name__)
                import traceback
                print("Traceback:", traceback.format_exc())
                raise serializers.ValidationError({'user': str(user_creation_error)})

            # Restaurant Creation
            print("Extracting restaurant data")
            restaurant_data = validated_data.pop('restaurant')
            print("Restaurant data:", restaurant_data)
            
            try:
                print("Initializing restaurant JSON fields")
                restaurant_data.setdefault('payment_methods', [])
                restaurant_data.setdefault('tags', [])
                restaurant_data.setdefault('address', '')
                restaurant_data.setdefault('phone_number', '')
                restaurant_data.setdefault('country', '')
                restaurant_data.setdefault('city', '')
                
                print("Creating restaurant")
                restaurant = Restaurant.objects.create(
                    owner=user,
                    **restaurant_data
                )
                print("Restaurant created successfully:", restaurant.name)
            except Exception as restaurant_creation_error:
                print("Error creating restaurant:", str(restaurant_creation_error))
                print("Error type:", type(restaurant_creation_error).__name__)
                import traceback
                print("Traceback:", traceback.format_exc())
                raise serializers.ValidationError({'restaurant': str(restaurant_creation_error)})

            # Sending Activation Email
            try:
                print("Sending activation email")
                self.send_activation_email(user, self.context['request'])
                print("Activation email sent successfully")
            except Exception as email_error:
                print("Error sending activation email:", str(email_error))
                print("Error type:", type(email_error).__name__)
                import traceback
                print("Traceback:", traceback.format_exc())
                # Log the error but don't raise it - allow registration to complete
                print("Continuing with registration despite email error")

            print("Registration completed successfully")
            return {
                'user': user,
                'restaurant': restaurant,
            }

    def send_activation_email(self, user, request):
        token = account_activation_token.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_activation_link = f"{settings.FRONTEND_URL}/activate/{uid}/{token}/"

        subject = 'Activate Your QrQaema Account'
        message = dedent(f"""
            Hi {user.username},
            
            Welcome to QrQaema!

            Please activate your account by clicking the link below:
            
            {frontend_activation_link}
            
            If you didn't sign up for this account, feel free to ignore this email.

            If you have any questions, reach out to us at {getattr(settings, 'SUPPORT_EMAIL', 'support@qrqaema.com')}.

            Thanks for joining QrQaema!

            Best regards,
            QrQaema Team

            ---

            This email was sent to {user.email}. If this wasn't you, please let us know.
        """)
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
