from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'ok': True, 'name': 'API Cafetería IES Pío Baroja', 'version': '2.0.0'})

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'ok': True,
        'endpoints': ['/auth', '/products', '/orders', '/payments', '/stats']
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', health_check),
    path('api/v1/', api_root),
    path('api/v1/', include('api.urls')),
]
