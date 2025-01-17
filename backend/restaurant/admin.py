from django.contrib import admin
from django.utils.html import format_html
from django import forms
import json
from django.contrib.auth.models import Group
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404

from .models import (
    Restaurant, MenuItem, Order, OrderItem,
    MenuItemOption, MenuItemBooleanOption, Category, Table, HelpRequest,
    Menu
)
from .serializers import (
    MenuItemSerializer, MenuItemOptionSerializer, MenuItemBooleanOptionSerializer,
    PasswordResetConfirmSerializer, PasswordResetSerializer, TableSerializer,
    UsernameRecoverySerializer
)

# Inline for MenuItems in Category
class MenuItemInline(admin.StackedInline):
    model = MenuItem
    extra = 0
    fields = ('name', 'description', 'price', 'image', 'is_available', 'order')
    show_change_link = True

# Inline for Categories in Menu
class CategoryInline(admin.StackedInline):
    model = Category
    extra = 0
    fields = ('name', 'description', 'image', 'order')
    show_change_link = True

# Inline for Menus in Restaurant
class MenuInline(admin.StackedInline):
    model = Menu
    extra = 0
    fields = ('name', 'language', 'is_default')
    show_change_link = True

# Register Restaurant model with Menu inline
@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'address', 'phone_number', 'display_tables', 'background_image_thumbnail')
    search_fields = ('name', 'owner__username', 'address')
    list_filter = ('owner',)
    readonly_fields = ('id',)
    inlines = [MenuInline]

    def display_tables(self, obj):
        return ", ".join([f"Table {table.number}" for table in obj.tables.all()])
    display_tables.short_description = 'Tables'

    def background_image_thumbnail(self, obj):
        if obj.background_image:
            return format_html('<img src="{}" style="width: 50px; height: 50px;" />', obj.background_image.url)
        return "No Image"
    background_image_thumbnail.short_description = 'Background Image'

# Inline for MenuItemBooleanOption (for each option like Extra Sauce, Spiciness Level)
class MenuItemBooleanOptionInline(admin.TabularInline):
    model = MenuItemBooleanOption
    extra = 1
    fields = ('name', 'price_modifier')
    show_change_link = True

# Custom form for MenuItemBooleanOption
class MenuItemBooleanOptionForm(forms.ModelForm):
    class Meta:
        model = MenuItemBooleanOption
        fields = ['name', 'price_modifier']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Option Name'}),
            'price_modifier': forms.NumberInput(attrs={'min': 0, 'step': 0.01}),
        }

# Register MenuItemBooleanOption with custom form in the admin
@admin.register(MenuItemBooleanOption)
class MenuItemBooleanOptionAdmin(admin.ModelAdmin):
    form = MenuItemBooleanOptionForm
    list_display = ('id', 'name', 'option_category', 'price_modifier')
    search_fields = ('option_category__name', 'name')
    list_filter = ('option_category',)
    readonly_fields = ('id',)

# Inline for MenuItemOptions (e.g., Size, Spiciness)
class MenuItemOptionInline(admin.TabularInline):
    model = MenuItemOption
    extra = 1
    fields = ('name',)
    show_change_link = True

# Custom form for MenuItemOption to handle the choices field
class MenuItemOptionForm(forms.ModelForm):
    class Meta:
        model = MenuItemOption
        fields = '__all__'
    widgets = {
        'choices': forms.Textarea(attrs={'rows': 5, 'cols': 40}),
    }

    def clean_choices(self):
        data = self.cleaned_data.get('choices')
        if data:
            try:
                choices = json.loads(data)
                if not isinstance(choices, list):
                    raise forms.ValidationError("Choices should be a valid JSON list of objects.")
                for choice in choices:
                    if not isinstance(choice, dict) or 'name' not in choice or 'price_modifier' not in choice:
                        raise forms.ValidationError("Each choice must be a JSON object with 'name' and 'price_modifier'.")
            except ValueError:
                raise forms.ValidationError("Invalid JSON format.")
        return data

# Register MenuItemOption model with custom form in admin
@admin.register(MenuItemOption)
class MenuItemOptionAdmin(admin.ModelAdmin):
    form = MenuItemOptionForm
    list_display = ('id', 'name', 'menu_item')
    search_fields = ('name', 'menu_item__name')
    list_filter = ('menu_item',)
    inlines = [MenuItemBooleanOptionInline]
    readonly_fields = ('id',)

# Register MenuItem model with inlines for options
@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'menu', 'restaurant', 'price', 'category')
    search_fields = ('name', 'restaurant__name', 'category__name')
    list_filter = ('restaurant', 'category', 'menu')
    inlines = [MenuItemOptionInline]
    readonly_fields = ('id',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('menu', 'restaurant', 'category')

# Inline for OrderItems in the OrderAdmin
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    fields = ('menu_item', 'quantity', 'special_request')
    show_change_link = True

# Register Order model with inline OrderItem management
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'restaurant', 'get_table_number', 'status', 'additional_info')
    search_fields = ('restaurant__name', 'table__number', 'status')
    list_filter = ('status', 'restaurant')
    inlines = [OrderItemInline]
    fieldsets = (
        (None, {
            'fields': ('restaurant', 'table', 'status', 'additional_info')
        }),
    )
    readonly_fields = ('id', 'additional_info')

    def get_table_number(self, obj):
        return obj.table.number if obj.table else "N/A"
    get_table_number.short_description = 'Table Number'

# Register OrderItem model
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'menu_item', 'quantity', 'special_request')
    search_fields = ('order__table__number', 'menu_item__name')
    list_filter = ('order__restaurant', 'menu_item')
    readonly_fields = ('id',)

# Register Category model with MenuItem inline
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'menu', 'restaurant', 'description', 'image_thumbnail')
    search_fields = ('name', 'menu__name', 'restaurant__name')
    list_filter = ('menu__restaurant', 'menu')
    fields = ('id', 'menu', 'restaurant', 'name', 'description', 'image')
    readonly_fields = ('id',)
    inlines = [MenuItemInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('menu', 'restaurant')

    def image_thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 50px; height: 50px;" />', obj.image.url)
        return "No Image"
    image_thumbnail.short_description = 'Image'

# Register Table model
@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('id', 'restaurant', 'number', 'status', 'capacity')
    search_fields = ('restaurant__name', 'number')
    list_filter = ('status', 'restaurant')
    readonly_fields = ('id',)

# Register Menu model with Category inline
@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'restaurant', 'language', 'is_default', 'created_at', 'updated_at')
    search_fields = ('name', 'restaurant__name')
    list_filter = ('restaurant', 'language', 'is_default')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('restaurant', '-is_default', 'name')
    inlines = [CategoryInline]

# Register HelpRequest model
@admin.register(HelpRequest)
class HelpRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'restaurant', 'get_table_number', 'user', 'status', 'created_at', 'updated_at')
    search_fields = ('restaurant__name', 'table__number', 'user__username')
    list_filter = ('status', 'restaurant')
    readonly_fields = ('id', 'created_at', 'updated_at')

    def get_table_number(self, obj):
        return obj.table.number if obj.table else "N/A"
    get_table_number.short_description = 'Table Number'
