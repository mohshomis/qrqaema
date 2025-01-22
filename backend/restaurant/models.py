# restaurant_app/models.py

from django.db import models
from django.contrib.auth.models import User
import qrcode
import os
from django.conf import settings
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image
import uuid
from django.utils.text import slugify
from .utils.image_compression import compress_image  # Import the compression utility

# Import signals
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

# Utility Functions
from .utils.filename_utils import generate_short_filename  # Import the utility

def get_restaurant_logo_path(instance, filename):
    restaurant_id = str(instance.id) if instance.id else 'temp'
    base_path = os.path.join('restaurants', restaurant_id, 'logos')
    # Prefix can be 'logo_' to indicate the file type
    filename = generate_short_filename(instance, filename, prefix='logo_')
    return os.path.join(base_path, filename)

def get_restaurant_background_path(instance, filename):
    restaurant_id = str(instance.id) if instance.id else 'temp'
    base_path = os.path.join('restaurants', restaurant_id, 'backgrounds')
    filename = generate_short_filename(instance, filename, prefix='background_')
    return os.path.join(base_path, filename)

def get_category_image_path(instance, filename):
    restaurant_id = str(instance.restaurant.id) if instance.restaurant.id else 'temp'
    category_slug = slugify(instance.name)
    base_path = os.path.join('restaurants', restaurant_id, 'categories', category_slug)
    filename = generate_short_filename(instance, filename, prefix=f"{category_slug}_")
    return os.path.join(base_path, filename)

def get_menu_image_path(instance, filename):
    restaurant_id = str(instance.restaurant.id) if instance.restaurant.id else 'temp'
    menu_item_slug = slugify(instance.name)
    base_path = os.path.join('restaurants', restaurant_id, 'menu_items', menu_item_slug)
    filename = generate_short_filename(instance, filename, prefix=f"{menu_item_slug}_")
    return os.path.join(base_path, filename)

def get_qrcode_path(instance, table_uuid):
    """
    Generates a unique file path for QR codes.
    Path: restaurants/<restaurant_uuid>/qrcodes/table_<table_uuid>.png
    """
    filename = f"table_{table_uuid}.png"
    return os.path.join('restaurants', str(instance.id), 'qrcodes', filename)

# Models

class Restaurant(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    owner = models.ForeignKey(
        User,
        related_name='owned_restaurants',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    staff = models.ManyToManyField(
        User,
        related_name='restaurants',
        blank=True
    )
    name = models.CharField(max_length=255)
    address = models.TextField(null=True)  # Required after activation
    phone_number = models.CharField(max_length=15, null=True)  # Required after activation
    logo = models.ImageField(upload_to=get_restaurant_logo_path, blank=True, null=True)
    background_image = models.ImageField(upload_to=get_restaurant_background_path, blank=True, null=True)
    
    # Required fields after activation
    country = models.CharField(max_length=100, null=True)
    city = models.CharField(max_length=100, null=True)
    postal_code = models.CharField(max_length=20, null=True)
    currency = models.CharField(max_length=10, default='EUR')  # ISO currency code
    number_of_employees = models.IntegerField(default=1)
    profile_completed = models.BooleanField(default=False)  # Track profile completion status
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    payment_methods = models.JSONField(default=list,blank=True, null=True)  # e.g., ['Cash', 'Credit Card', 'Mobile Payments']
    tags = models.JSONField(default=list,blank=True, null=True)  # e.g., ['Halal', 'Vegan', 'Outdoor Seating']
    business_license = models.CharField(max_length=100, blank=True, null=True)
    default_language = models.CharField(max_length=10, default='en')  # Default language for the restaurant
    
    @property
    def table_count(self):
        return self.tables.count()

    def generate_qr_code(self, table_uuid):
        try:
            table = self.tables.get(id=table_uuid)
            # Step 1: Generate the QR code URL using UUIDs and default menu
            frontend_url = settings.FRONTEND_URL.rstrip('/')
            default_menu = self.menus.filter(is_default=True).first()
            if not default_menu:
                default_menu = self.menus.first()  # Fallback to any menu if no default
            
            menu_id = default_menu.id if default_menu else None
            url = f"{frontend_url}/restaurant/{self.id}/menu/{menu_id}/table/{table.id}"
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )
            qr.add_data(url)
            qr.make(fit=True)
            qr_img = qr.make_image(fill="black", back_color="white")

            # Step 2: Load the custom background image (qr_frame) from the media directory
            background_path = os.path.join(settings.MEDIA_ROOT, 'qr_frame.png')
            if not os.path.exists(background_path):
                raise FileNotFoundError(f"Background image not found at {background_path}")

            background_img = Image.open(background_path).convert("RGBA")

            # Step 3: Resize the QR code to fit within the background frame
            qr_size = (282, 285)  # Adjust size based on your background dimensions
            qr_img = qr_img.resize(qr_size)

            # Step 4: Calculate the position to paste the QR code
            vertical_offset = 40  # Adjust as needed
            qr_position = (
                (background_img.width - qr_img.width) // 2,
                max(0, (background_img.height - qr_img.height) // 2 - vertical_offset)
            )

            # Step 5: Paste the QR code onto the background image
            background_img.paste(qr_img, qr_position)

            # Step 6: Save the final image in memory
            qr_with_bg_io = BytesIO()
            background_img.save(qr_with_bg_io, format='PNG')

            # Step 7: Use Django's default storage to save the image
            qr_image_path = get_qrcode_path(self, table.id)
            qr_image_content = ContentFile(qr_with_bg_io.getvalue())
            saved_path = default_storage.save(qr_image_path, qr_image_content)
        
            # Step 8: Construct the full URL for downloading
            # Use the backend URL (localhost:8000) for serving media files
            backend_url = settings.FRONTEND_URL.replace('3000', '8000').rstrip('/')
            media_url = settings.MEDIA_URL.strip('/')
            qr_code_url = f"{backend_url}/{media_url}/{saved_path}"
        
            return qr_code_url  # Return the file path for downloading

        except Table.DoesNotExist:
            print(f"[ERROR] Table UUID {table_uuid} does not exist in restaurant {self.name}.")
            raise ValueError(f"Table UUID {table_uuid} does not exist in restaurant {self.name}.")
        except Exception as e:
            print(f"[ERROR] Error generating QR code for table UUID {table_uuid}: {e}")
            raise e

    def generate_all_qr_codes(self):
        try:
            qr_paths = []
            for table in self.tables.all():
                qr_path = self.generate_qr_code(table.id)
                qr_paths.append(qr_path)
            return qr_paths
        except Exception as e:
            print(f"[ERROR] Error generating all QR codes for Restaurant {self.name}: {e}")
            raise e

    def save(self, *args, **kwargs):
        # Compress logo if it exists
        if self.logo:
            self.logo.save(
                self.logo.name,
                compress_image(self.logo),
                save=False
            )
        
        # Compress background image if it exists
        if self.background_image:
            self.background_image.save(
                self.background_image.name,
                compress_image(self.background_image),
                save=False
            )
        
        super(Restaurant, self).save(*args, **kwargs)

    def __str__(self):
        return self.name

class Menu(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('ar', 'Arabic'),
        ('tr', 'Turkish'),
        ('nl', 'Dutch')
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menus')
    name = models.CharField(max_length=255)  # e.g., "Lunch Menu", "Dinner Menu"
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES)  # Restricted to supported languages
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('restaurant', 'language')

    def clean(self):
        from django.core.exceptions import ValidationError
        # Check if another menu with same language exists for this restaurant
        if Menu.objects.filter(restaurant=self.restaurant, language=self.language).exclude(id=self.id).exists():
            raise ValidationError(f"A menu in {self.language} already exists for this restaurant.")

    def save(self, *args, **kwargs):
        self.clean()
        # If this is marked as default, unmark other menus as default
        if self.is_default:
            Menu.objects.filter(restaurant=self.restaurant).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Menu ({self.language}) - {self.restaurant.name}"

    @classmethod
    def get_available_languages(cls, restaurant):
        """Get list of languages that have menus for this restaurant."""
        return list(cls.objects.filter(restaurant=restaurant).values_list('language', flat=True))

class Category(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to=get_category_image_path, blank=True, null=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'categories'

    def save(self, *args, **kwargs):
        if self.image:
            self.image.save(
                self.image.name,
                compress_image(self.image),
                save=False
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.menu.language})"

class MenuItem(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='menu_items', null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='menu_items', null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2)
    image = models.ImageField(upload_to=get_menu_image_path, blank=True, null=True)
    is_available = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if self.image:
            self.image.save(
                self.image.name,
                compress_image(self.image),
                save=False
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.menu.language})"

class MenuItemOption(models.Model):
    menu_item = models.ForeignKey(MenuItem, related_name='options', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class MenuItemBooleanOption(models.Model):
    option_category = models.ForeignKey(MenuItemOption, related_name='choices', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)  # Option Choice Name (e.g., Hot)
    price_modifier = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.name} ({self.price_modifier}€) for {self.option_category.name} of {self.option_category.menu_item.name}"

class Table(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Occupied', 'Occupied'),
        ('Reserved', 'Reserved'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    restaurant = models.ForeignKey(
        Restaurant,
        related_name='tables',
        on_delete=models.CASCADE
    )
    number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    capacity = models.PositiveIntegerField(default=4)  # Example additional field

    class Meta:
        unique_together = ('restaurant', 'number')
        ordering = ['number']

    def __str__(self):
        return f"Table {self.number} at {self.restaurant.name}"

    def delete(self, *args, **kwargs):
        # Optionally, delete related QR codes or perform other cleanup
        qr_code_path = get_qrcode_path(self.restaurant, self.id)
        if default_storage.exists(qr_code_path):
            default_storage.delete(qr_code_path)
            print(f"Deleted QR code image for Table {self.id}: {qr_code_path}")
        super().delete(*args, **kwargs)

class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    table = models.ForeignKey(Table, on_delete=models.CASCADE)
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)  # Track which menu was used
    additional_info = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order for table {self.table.number} - {self.status}"

    def get_order_details(self):
        """Get detailed order information including menu details"""
        items = self.order_items.select_related('menu_item').prefetch_related('selected_options')
        return {
            'id': self.id,
            'status': self.status,
            'menu': self.menu.id if self.menu else None,
            'menu_language': self.menu.language if self.menu else None,
            'items': [
                {
                    'menu_item': item.menu_item.name,
                    'quantity': item.quantity,
                    'special_request': item.special_request,
                    'selected_options': [option.name for option in item.selected_options.all()],
                    'total_price': str(item.total_price)
                }
                for item in items
            ],
            'additional_info': self.additional_info
        }

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='order_items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    special_request = models.TextField(blank=True, null=True)
    selected_options = models.ManyToManyField(MenuItemBooleanOption, blank=True)

    @property
    def total_price(self):
        base_price = self.menu_item.price
        for boolean_option in self.selected_options.all():
            base_price += boolean_option.price_modifier
        return base_price * self.quantity

    def __str__(self):
        return f"OrderItem: {self.menu_item.name} (x{self.quantity})"

class HelpRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Resolved', 'Resolved'),
        ('Declined', 'Declined'),
    ]

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='help_requests')
    table = models.ForeignKey(Table, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"HelpRequest at {self.restaurant.name}, Table {self.table.number} - {self.status}"

class MenuAccess(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_accesses')
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='accesses', null=True, blank=True)
    accessed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Menu access for {self.restaurant.name} ({self.menu.language}) at {self.accessed_at}"

# Signal Handlers

@receiver(post_delete, sender=Restaurant)
def delete_restaurant_images(sender, instance, **kwargs):
    if instance.logo and default_storage.exists(instance.logo.name):
        default_storage.delete(instance.logo.name)
        print(f"Deleted logo image: {instance.logo.name}")
    if instance.background_image and default_storage.exists(instance.background_image.name):
        default_storage.delete(instance.background_image.name)
        print(f"Deleted background image: {instance.background_image.name}")

@receiver(post_delete, sender=Category)
def delete_category_image(sender, instance, **kwargs):
    if instance.image and default_storage.exists(instance.image.name):
        default_storage.delete(instance.image.name)
        print(f"Deleted category image: {instance.image.name}")

@receiver(post_delete, sender=MenuItem)
def delete_menuitem_image(sender, instance, **kwargs):
    if instance.image and default_storage.exists(instance.image.name):
        default_storage.delete(instance.image.name)
        print(f"Deleted menu item image: {instance.image.name}")

@receiver(pre_save, sender=Restaurant)
def auto_delete_restaurant_old_images_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False

    try:
        old_instance = Restaurant.objects.get(pk=instance.pk)
        if old_instance.logo and instance.logo != old_instance.logo and default_storage.exists(old_instance.logo.name):
            default_storage.delete(old_instance.logo.name)
            print(f"Deleted old logo image: {old_instance.logo.name}")
        if old_instance.background_image and instance.background_image != old_instance.background_image and default_storage.exists(old_instance.background_image.name):
            default_storage.delete(old_instance.background_image.name)
            print(f"Deleted old background image: {old_instance.background_image.name}")
    except Restaurant.DoesNotExist:
        return False

@receiver(pre_save, sender=Category)
def auto_delete_category_old_image_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False

    try:
        old_instance = Category.objects.get(pk=instance.pk)
        if old_instance.image and instance.image != old_instance.image and default_storage.exists(old_instance.image.name):
            default_storage.delete(old_instance.image.name)
            print(f"Deleted old category image: {old_instance.image.name}")
    except Category.DoesNotExist:
        return False

@receiver(pre_save, sender=MenuItem)
def auto_delete_menuitem_old_image_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False

    try:
        old_instance = MenuItem.objects.get(pk=instance.pk)
        if old_instance.image and instance.image != old_instance.image and default_storage.exists(old_instance.image.name):
            default_storage.delete(old_instance.image.name)
            print(f"Deleted old menu item image: {old_instance.image.name}")
    except MenuItem.DoesNotExist:
        return False

@receiver(post_delete, sender=Restaurant)
def delete_restaurant_folder(sender, instance, **kwargs):
    base_path = f"restaurants/{instance.id}/"
    print(f"Attempting to delete all files under {base_path}")

    if hasattr(default_storage, 'bucket') and hasattr(default_storage.bucket, 'objects'):
        for obj in default_storage.bucket.objects.filter(Prefix=base_path):
            default_storage.delete(obj.key)
            print(f"Deleted file: {obj.key}")
        print(f"Deleted all files under {base_path}")
    else:
        print("Default storage does not support bucket objects. Manual deletion may be required.")
