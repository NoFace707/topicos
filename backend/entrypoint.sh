#!/bin/sh
set -e

echo "Esperando a que la base de datos PostgreSQL esté lista..."
python manage.py wait_for_db

echo "Aplicando migraciones de base de datos..."
python manage.py migrate --noinput

echo "Iniciando servidor Django..."
exec "$@"
