from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import Order, OrderItem, Product, generate_pickup_code
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusSerializer
from .permissions import IsStaff
from .views_auth import api_error


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Order.objects.prefetch_related('items')
        is_staff = request.user.role == 'staff'
        all_orders = request.query_params.get('all', 'false') == 'true'
        if not (is_staff and all_orders):
            qs = qs.filter(user=request.user)
        order_status = request.query_params.get('status')
        if order_status:
            qs = qs.filter(status=order_status)
        results = OrderSerializer(qs, many=True).data
        return Response({'count': len(results), 'page': 1, 'page_size': len(results), 'next': None, 'previous': None, 'results': results})

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('VALIDATION_ERROR', serializer.errors, status.HTTP_422_UNPROCESSABLE_ENTITY)

        validated = serializer.validated_data
        items_data = validated['items']
        pickup_slot = validated['pickup_slot']
        notes = validated.get('notes', '')

        product_map = {}
        for item in items_data:
            pid = int(item['product_id'])
            try:
                product_map[pid] = Product.objects.get(pk=pid)
            except Product.DoesNotExist:
                return api_error('NOT_FOUND', f'Producto {pid} no encontrado.', status.HTTP_404_NOT_FOUND)

        total = Decimal('0.00')
        full_items = []
        for item in items_data:
            pid = int(item['product_id'])
            qty = int(item.get('quantity', 1))
            product = product_map[pid]
            subtotal = (product.price * qty).quantize(Decimal('0.01'))
            total += subtotal
            full_items.append({'product': product, 'quantity': qty, 'subtotal': subtotal})

        with transaction.atomic():
            order = Order.objects.create(
                user=request.user, user_name=request.user.name,
                status='pending_payment', total=total,
                pickup_slot=pickup_slot, notes=notes,
            )
            for fi in full_items:
                p = fi['product']
                OrderItem.objects.create(
                    order=order, product=p, name=p.name, emoji=p.emoji,
                    quantity=fi['quantity'], unit_price=p.price, subtotal=fi['subtotal'],
                )
                # ✅ Descontar stock
                Product.objects.filter(pk=p.pk).update(
                    stock=max(0, p.stock - fi['quantity'])
                )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            order = Order.objects.prefetch_related('items').get(pk=pk)
        except Order.DoesNotExist:
            return None, api_error('NOT_FOUND', 'Pedido no encontrado.', status.HTTP_404_NOT_FOUND)
        if user.role != 'staff' and order.user_id != user.id:
            return None, api_error('FORBIDDEN', 'No tienes acceso a este pedido.', status.HTTP_403_FORBIDDEN)
        return order, None

    def get(self, request, pk):
        order, err = self.get_object(pk, request.user)
        if err: return err
        return Response(OrderSerializer(order).data)


class OrderStatusView(APIView):
    permission_classes = [IsStaff]

    def patch(self, request, pk):
        serializer = OrderStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error('VALIDATION_ERROR', serializer.errors, status.HTTP_422_UNPROCESSABLE_ENTITY)
        try:
            order = Order.objects.prefetch_related('items').get(pk=pk)
        except Order.DoesNotExist:
            return api_error('NOT_FOUND', 'Pedido no encontrado.', status.HTTP_404_NOT_FOUND)
        order.status = serializer.validated_data['status']
        order.save(update_fields=['status', 'updated_at'])
        return Response(OrderSerializer(order).data)


class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items').get(pk=pk)
        except Order.DoesNotExist:
            return api_error('NOT_FOUND', 'Pedido no encontrado.', status.HTTP_404_NOT_FOUND)
        if request.user.role != 'staff' and order.user_id != request.user.id:
            return api_error('FORBIDDEN', 'No tienes acceso a este pedido.', status.HTTP_403_FORBIDDEN)
        if order.status == 'delivered':
            return api_error('INVALID_STATE', 'El pedido ya fue entregado.', status.HTTP_409_CONFLICT)
        
        with transaction.atomic():
            # ✅ Restaurar stock al cancelar
            for item in order.items.all():
                if item.product:
                    Product.objects.filter(pk=item.product.pk).update(
                        stock=item.product.stock + item.quantity
                    )
            order.status = 'cancelled'
            order.save(update_fields=['status', 'updated_at'])
        
        return Response(OrderSerializer(order).data)
