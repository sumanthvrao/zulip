# Generated by Django 2.2.16 on 2020-10-20 04:15

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0303_realm_wildcard_mention_policy'),
    ]

    operations = [
        migrations.CreateModel(
            name='RealmPlayground',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url_prefix', models.TextField(validators=[django.core.validators.URLValidator()])),
                ('name', models.CharField(db_index=True, max_length=60)),
                ('pygments_language', models.CharField(db_index=True, max_length=40, validators=[django.core.validators.RegexValidator(message='Invalid characters in pygments language', regex='^[ a-zA-Z0-9_+-./#]*$')])),
                ('realm', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='zerver.Realm')),
            ],
            options={
                'unique_together': {('realm', 'name')},
            },
        ),
    ]
