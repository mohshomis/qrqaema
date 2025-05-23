from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail, get_connection
from django.conf import settings
from textwrap import dedent
from django.db import transaction
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from authentication.tokens import account_activation_token
from ..models import Restaurant
from .restaurant_serializers import RestaurantSerializer
from time import sleep

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        with transaction.atomic():
            # Lock the rows to prevent race conditions
            if User.objects.select_for_update().filter(username=validated_data['username']).exists():
                raise serializers.ValidationError("This username is already taken.")
            
            if validated_data.get('email') and User.objects.select_for_update().filter(email=validated_data['email']).exists():
                raise serializers.ValidationError("This email is already registered.")

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

    def send_activation_email_with_retry(self, user, request, max_retries=3):
        """Send activation email with retry mechanism"""
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

        last_error = None
        for attempt in range(max_retries):
            try:
                # Get a new connection for each attempt
                connection = get_connection(fail_silently=False)
                
                # Try to send email
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    connection=connection
                )
                print(f"Email sent successfully on attempt {attempt + 1}")
                return True
            except Exception as e:
                last_error = e
                print(f"Email sending failed on attempt {attempt + 1}: {str(e)}")
                if attempt < max_retries - 1:
                    # Exponential backoff: 1s, 2s, 4s
                    sleep_time = 2 ** attempt
                    print(f"Waiting {sleep_time} seconds before retry...")
                    sleep(sleep_time)
                    continue
        
        # If we get here, all retries failed
        print("All email sending attempts failed")
        raise serializers.ValidationError({
            'email': f'Failed to send activation email after {max_retries} attempts. Please try registering again or contact support.'
        })

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
            
            # Check for existing user/email with row locking
            if User.objects.select_for_update().filter(username=user_data['username']).exists():
                raise serializers.ValidationError({'user': 'This username is already taken.'})
            
            if user_data.get('email') and User.objects.select_for_update().filter(email=user_data['email']).exists():
                raise serializers.ValidationError({'user': 'This email is already registered.'})

            try:
                print("Creating user")
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data.get('email'),
                    password=user_data['password'],
                    is_active=False
                )
                print("User created successfully:", user.username)

                # Restaurant Creation
                print("Extracting restaurant data")
                restaurant_data = validated_data.pop('restaurant')
                print("Restaurant data:", restaurant_data)
                
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

                # Sending Activation Email (now part of transaction)
                print("Sending activation email")
                self.send_activation_email_with_retry(user, self.context['request'])
                print("Activation email sent successfully")

                print("Registration completed successfully")
                return {
                    'user': user,
                    'restaurant': restaurant,
                }

            except Exception as creation_error:
                print("Error during creation:", str(creation_error))
                print("Error type:", type(creation_error).__name__)
                import traceback
                print("Traceback:", traceback.format_exc())
                raise serializers.ValidationError({'error': str(creation_error)})
