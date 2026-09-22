from django.db import connection
from django.utils import timezone
import django
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


class HealthCheckView(APIView):
    """
    Endpoint de diagnóstico para verificar el estado de Django y la conexión a PostgreSQL.
    """
    def get(self, request):
        db_connected = False
        db_error = None

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                if row and row[0] == 1:
                    db_connected = True
        except Exception as exc:
            db_error = str(exc)

        http_status = status.HTTP_200_OK if db_connected else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                "status": "online" if db_connected else "degraded",
                "message": "API de Django operativa y lista para el desarrollo.",
                "database": {
                    "connected": db_connected,
                    "engine": "PostgreSQL",
                    "error": db_error,
                },
                "django_version": django.get_version(),
                "timestamp": timezone.now().isoformat(),
            },
            status=http_status,
        )
    permission_classes = [AllowAny]
    authentication_classes = []
