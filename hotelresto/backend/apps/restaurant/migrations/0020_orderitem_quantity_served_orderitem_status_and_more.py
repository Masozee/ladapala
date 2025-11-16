# Generated manually for partial serving feature

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('restaurant', '0019_restaurant_serial_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='quantity_served',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='orderitem',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending'),
                    ('PREPARING', 'Preparing'),
                    ('READY', 'Ready'),
                    ('PARTIALLY_SERVED', 'Partially Served'),
                    ('SERVED', 'Served'),
                ],
                default='PENDING',
                max_length=20
            ),
        ),
        migrations.CreateModel(
            name='ServingHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity_served', models.IntegerField()),
                ('served_at', models.DateTimeField(auto_now_add=True)),
                ('notes', models.TextField(blank=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='serving_history', to='restaurant.order')),
                ('order_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='serving_history', to='restaurant.orderitem')),
                ('served_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='served_orders', to='restaurant.staff')),
            ],
            options={
                'verbose_name_plural': 'Serving Histories',
                'ordering': ['-served_at'],
            },
        ),
    ]
