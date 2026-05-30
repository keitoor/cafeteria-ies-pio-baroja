"""
Vistas de autenticación:
  POST /api/v1/auth/google/   - Login con Google SSO (simplificado)
  POST /api/v1/auth/staff/    - Login staff con usuario/contraseña
  POST /api/v1/auth/refresh/  - Refresca access token
  POST /api/v1/auth/logout/   - Cierra sesión
  GET  /api/v1/auth/me/       - Devuelve datos del usuario autenticado
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .serializers import UserSerializer


def api_error(code, message, status_code=400):
    return Response(
        {'error': code, 'detail': message},
        status=status_code
    )


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    refresh['name'] = user.name
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class GoogleLoginView(APIView):
    """
    POST /api/v1/auth/google/
    Body: { email, name, picture? }
    Respuesta: { access, refresh, user }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        name = request.data.get('name', '').strip()
        picture = request.data.get('picture', None)

        if not email or not name:
            return api_error(
                'VALIDATION_ERROR',
                'Los campos email y name son obligatorios.',
                status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'name': name, 'role': 'client'}
        )
        if not created and picture:
            user.picture = picture
            user.save(update_fields=['picture'])

        tokens = get_tokens_for_user(user)
        return Response({
            **tokens,
            'user': UserSerializer(user).data,
        })


class StaffLoginView(APIView):
    """
    POST /api/v1/auth/staff/
    Body: { username, password }
    Respuesta: { access, refresh, user }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not username or not password:
            return api_error(
                'VALIDATION_ERROR',
                'Los campos username y password son obligatorios.',
                status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        email = username if '@' in username else f'{username}@iespiobaroja.es'

        try:
            user = User.objects.get(email=email, role='staff')
        except User.DoesNotExist:
            return api_error(
                'INVALID_CREDENTIALS',
                'Usuario o contraseña incorrectos.',
                status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return api_error(
                'INVALID_CREDENTIALS',
                'Usuario o contraseña incorrectos.',
                status.HTTP_401_UNAUTHORIZED
            )

        tokens = get_tokens_for_user(user)
        return Response({
            **tokens,
            'user': UserSerializer(user).data,
        })


class RefreshTokenView(APIView):
    """
    POST /api/v1/auth/refresh/
    Body: { refresh }
    Respuesta: { access }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return api_error(
                'VALIDATION_ERROR',
                'Falta el refresh token.',
                status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        try:
            token = RefreshToken(refresh_token)
            return Response({'access': str(token.access_token)})
        except TokenError:
            return api_error(
                'TOKEN_EXPIRED',
                'El refresh token ha expirado o no es válido.',
                status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Body: { refresh }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """
    GET /api/v1/auth/me/
    Devuelve el usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
