import time
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.utils import OperationalError
from psycopg import OperationalError as PsycopgOperationalError


class Command(BaseCommand):
    """Comando de Django para pausar la ejecución hasta que la base de datos esté disponible."""
    help = "Espera a que la base de datos PostgreSQL esté disponible."

    def handle(self, *args, **options):
        self.stdout.write("Comprobando disponibilidad de la base de datos PostgreSQL...")
        db_up = False
        attempts = 0
        max_attempts = 30

        while not db_up and attempts < max_attempts:
            try:
                connection.ensure_connection()
                db_up = True
            except (OperationalError, PsycopgOperationalError) as exc:
                attempts += 1
                self.stdout.write(f"Base de datos no disponible aún (intento {attempts}/{max_attempts}). Esperando 1 segundo...")
                time.sleep(1)

        if db_up:
            self.stdout.write(self.style.SUCCESS("¡Base de datos PostgreSQL disponible y conectada exitosamente!"))
        else:
            self.stdout.write(self.style.ERROR("Error: No se pudo conectar a la base de datos después del tiempo límite."))
            raise SystemExit(1)
