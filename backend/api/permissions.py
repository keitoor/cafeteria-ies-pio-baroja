from rest_framework.permissions import BasePermission, IsAuthenticated


class IsStaff(BasePermission):
    """Solo usuarios con rol 'staff' pueden acceder."""
    message = 'No tienes permisos suficientes para realizar esta acción.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'staff'
        )


class IsClient(BasePermission):
    """Usuarios autenticados con rol 'client'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
