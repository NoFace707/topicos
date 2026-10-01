import datetime

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("budgeting", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="financialtransaction",
            name="counterparty",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="financialtransaction",
            name="transaction_time",
            field=models.TimeField(default=datetime.time(0, 0)),
        ),
        migrations.AlterModelOptions(
            name="financialtransaction",
            options={"ordering": ["-date", "-transaction_time", "-id"]},
        ),
    ]
