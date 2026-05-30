"""
Vistas de pagos (simulación Redsys):
  POST /api/v1/payments/redsys/initiate/ - Inicia el pago
  POST /api/v1/payments/redsys/notify/   - Notificación IPN (webhook del banco)

En un entorno real, Redsys:
  1. Recibe los parámetros firmados y muestra su TPV
  2. Llama al endpoint notify/ con la confirmación del pago
  3. El backend verifica la firma y actualiza el pedido

Aquí simulamos ambos pasos.
"""

import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Order, generate_pickup_code
from .serializers import OrderSerializer
from .views_auth import api_error


class RedsysInitiateView(APIView):
    """
    POST /api/v1/payments/redsys/initiate/
    Body: { order_id }
    Simula la apertura del TPV de Redsys y confirma el pago.
    En producción devolvería los parámetros firmados para redirigir al TPV.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return api_error('VALIDATION_ERROR', 'Falta el campo order_id.', status.HTTP_422_UNPROCESSABLE_ENTITY)

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return api_error('NOT_FOUND', 'Pedido no encontrado.', status.HTTP_404_NOT_FOUND)

        if order.user_id != request.user.id:
            return api_error('FORBIDDEN', 'No puedes pagar este pedido.', status.HTTP_403_FORBIDDEN)

        if order.status != 'pending_payment':
            return api_error('INVALID_STATE', 'Este pedido no está pendiente de pago.', status.HTTP_409_CONFLICT)

        # Simula un 10% de rechazo bancario
        if random.random() < 0.1:
            return api_error(
                'PAYMENT_DECLINED',
                'El pago ha sido rechazado por la entidad bancaria. Inténtalo de nuevo.',
                status.HTTP_402_PAYMENT_REQUIRED
            )

        pickup_code = generate_pickup_code()
        order.status = 'paid'
        order.pickup_code = pickup_code
        order.save(update_fields=['status', 'pickup_code', 'updated_at'])

        return Response({
            'order_id': order.id,
            'pickup_code': pickup_code,
            'status': 'paid',
        })


class RedsysNotifyView(APIView):
    """
    POST /api/v1/payments/redsys/notify/
    Webhook IPN que Redsys llamaría tras confirmar el pago.
    En producción se verificaría la firma HMAC256 de Redsys.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # En producción: verificar firma Redsys aquí
        order_id = request.data.get('Ds_Order') or request.data.get('order_id')
        response_code = request.data.get('Ds_Response', '0000')

        if not order_id:
            return api_error('VALIDATION_ERROR', 'Falta Ds_Order.', status.HTTP_422_UNPROCESSABLE_ENTITY)

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return api_error('NOT_FOUND', 'Pedido no encontrado.', status.HTTP_404_NOT_FOUND)

        # Redsys: códigos 0000-0099 son éxito
        success = str(response_code).zfill(4) <= '0099'
        if success and order.status == 'pending_payment':
            order.status = 'paid'
            order.pickup_code = generate_pickup_code()
            order.save(update_fields=['status', 'pickup_code', 'updated_at'])

        return Response({'ok': True})
