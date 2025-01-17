from django.db import migrations

def create_default_menus(apps, schema_editor):
    Restaurant = apps.get_model('restaurant', 'Restaurant')
    Menu = apps.get_model('restaurant', 'Menu')
    Category = apps.get_model('restaurant', 'Category')
    MenuItem = apps.get_model('restaurant', 'MenuItem')

    # For each restaurant
    for restaurant in Restaurant.objects.all():
        # Create default menu if it doesn't exist
        default_menu, created = Menu.objects.get_or_create(
            restaurant=restaurant,
            language=restaurant.default_language,
            defaults={
                'name': 'Default Menu',
                'is_default': True
            }
        )

        # Associate existing categories with the default menu
        Category.objects.filter(
            restaurant=restaurant,
            menu__isnull=True
        ).update(menu=default_menu)

        # Associate existing menu items with the default menu
        MenuItem.objects.filter(
            restaurant=restaurant,
            menu__isnull=True
        ).update(menu=default_menu)

def reverse_default_menus(apps, schema_editor):
    Menu = apps.get_model('restaurant', 'Menu')
    Menu.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('restaurant', '0008_alter_category_options_alter_menuitem_options_and_more'),
    ]

    operations = [
        migrations.RunPython(create_default_menus, reverse_default_menus),
    ]
