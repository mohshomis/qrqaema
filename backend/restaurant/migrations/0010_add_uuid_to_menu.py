from django.db import migrations, models
import uuid

def gen_uuid(apps, schema_editor):
    Menu = apps.get_model('restaurant', 'Menu')
    for row in Menu.objects.all():
        row.uuid = uuid.uuid4()
        row.save(update_fields=['uuid'])

class Migration(migrations.Migration):
    dependencies = [
        ('restaurant', '0009_create_default_menus'),
    ]

    operations = [
        # Add UUID field, allowing null for now
        migrations.AddField(
            model_name='menu',
            name='uuid',
            field=models.UUIDField(null=True, blank=True, default=uuid.uuid4),
        ),
        # Run function to generate UUIDs for existing rows
        migrations.RunPython(gen_uuid, reverse_code=migrations.RunPython.noop),
        # Set uuid field to non-nullable and unique
        migrations.AlterField(
            model_name='menu',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
        # Remove old id field and make uuid the primary key
        migrations.RemoveField(
            model_name='menu',
            name='id',
        ),
        migrations.RenameField(
            model_name='menu',
            old_name='uuid',
            new_name='id',
        ),
        migrations.AlterField(
            model_name='menu',
            name='id',
            field=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False),
        ),
    ]
