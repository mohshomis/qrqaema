# Generated by Django 4.2.16 on 2025-01-18 21:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurant', '0003_alter_category_menu'),
    ]

    operations = [
        migrations.AlterField(
            model_name='menu',
            name='language',
            field=models.CharField(choices=[('en', 'English'), ('ar', 'Arabic'), ('tr', 'Turkish'), ('nl', 'Dutch')], max_length=10),
        ),
    ]
