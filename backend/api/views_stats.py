"""
Vistas de estadísticas (solo staff):
  GET /api/v1/stats/summary/       - Resumen del día
  GET /api/v1/stats/sales/         - Ventas últimos 7 días
  GET /api/v1/stats/top-products/  - Productos más vendidos
"""

from datetime import date, timedelta
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Order, OrderItem
from .permissions import IsStaff


EXCLUDED = ['cancelled', 'pending_payment']


class StatsSummaryView(APIView):
    """GET /api/v1/stats/summary/"""
    permission_classes = [IsStaff]

    def get(self, request):
        today = date.today()

        today_qs = Order.objects.filter(
            created_at__date=today
        ).exclude(status__in=EXCLUDED)

        agg = today_qs.aggregate(
            orders=Count('id'),
            revenue=Sum('total')
        )
        orders = agg['orders'] or 0
        revenue = float(agg['revenue'] or 0)
        avg_ticket = round(revenue / orders, 2) if orders > 0 else 0

        pending = Order.objects.filter(status='paid').count()

        return Response({
            'today_orders': orders,
            'today_revenue': round(revenue, 2),
            'avg_ticket': avg_ticket,
            'pending_orders': pending,
        })


class StatsSalesView(APIView):
    """GET /api/v1/stats/sales/?days=7&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD"""
    permission_classes = [IsStaff]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = Order.objects.exclude(status__in=EXCLUDED)

        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # Construir serie de días
        end = date.today()
        start = end - timedelta(days=days - 1)

        # Datos agrupados por día
        daily = (
            qs.filter(created_at__date__gte=start)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(orders=Count('id'), revenue=Sum('total'))
            .order_by('day')
        )
        daily_map = {
            str(row['day']): {'orders': row['orders'], 'revenue': float(row['revenue'] or 0)}
            for row in daily
        }

        series = []
        for i in range(days):
            d = str(start + timedelta(days=i))
            entry = daily_map.get(d, {'orders': 0, 'revenue': 0.0})
            series.append({'date': d, **entry})

        return Response({
            'granularity': 'day',
            'series': series,
            'total_orders': sum(s['orders'] for s in series),
            'total_revenue': round(sum(s['revenue'] for s in series), 2),
        })


class StatsTopProductsView(APIView):
    """GET /api/v1/stats/top-products/?limit=5"""
    permission_classes = [IsStaff]

    def get(self, request):
        limit = min(int(request.query_params.get('limit', 5)), 20)

        rows = (
            OrderItem.objects
            .exclude(order__status__in=EXCLUDED)
            .values('product_id', 'name', 'emoji')
            .annotate(units_sold=Sum('quantity'), revenue=Sum('subtotal'))
            .order_by('-units_sold')[:limit]
        )

        return Response([
            {
                'product_id': r['product_id'],
                'name': r['name'],
                'emoji': r['emoji'],
                'units_sold': r['units_sold'],
                'revenue': round(float(r['revenue'] or 0), 2),
            }
            for r in rows
        ])
