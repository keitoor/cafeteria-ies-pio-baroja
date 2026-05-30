"""
Vistas de productos:
  GET    /api/v1/products/              - Listar productos (público)
  POST   /api/v1/products/             - Crear producto (staff)
  GET    /api/v1/products/favorites/   - Favoritos del usuario
  POST   /api/v1/products/<id>/favorite/ - Toggle favorito
  GET    /api/v1/products/<id>/        - Detalle producto
  PATCH  /api/v1/products/<id>/        - Editar producto (staff)
  DELETE /api/v1/products/<id>/        - Eliminar producto (staff)
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Product, Favorite
from .serializers import ProductSerializer, ProductWriteSerializer
from .permissions import IsStaff
from .views_auth import api_error


def paginated_response(queryset, serializer_class):
    results = serializer_class(queryset, many=True).data
    return Response({
        'count': len(results),
        'page': 1,
        'page_size': len(results),
        'next': None,
        'previous': None,
        'results': results,
    })


class ProductListView(APIView):
    """GET/POST /api/v1/products/"""

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStaff()]
        return [AllowAny()]

    def get(self, request):
        qs = Product.objects.all()
        search = request.query_params.get('search', '')
        category = request.query_params.get('category', 'todos')

        if category and category != 'todos':
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(description__icontains=search)
            qs = qs.distinct()

        return paginated_response(qs, ProductSerializer)

    def post(self, request):
        serializer = ProductWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                'VALIDATION_ERROR',
                serializer.errors,
                status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        product = serializer.save()
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    """GET/PATCH/DELETE /api/v1/products/<id>/"""

    def get_permissions(self):
        if self.request.method in ['PATCH', 'DELETE']:
            return [IsStaff()]
        return [AllowAny()]

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return api_error('NOT_FOUND', 'Producto no encontrado.', status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product).data)

    def patch(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return api_error('NOT_FOUND', 'Producto no encontrado.', status.HTTP_404_NOT_FOUND)
        serializer = ProductWriteSerializer(product, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_error('VALIDATION_ERROR', serializer.errors, status.HTTP_422_UNPROCESSABLE_ENTITY)
        serializer.save()
        return Response(ProductSerializer(product).data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return api_error('NOT_FOUND', 'Producto no encontrado.', status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FavoritesView(APIView):
    """GET /api/v1/products/favorites/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favs = Product.objects.filter(favorited_by__user=request.user)
        return Response(ProductSerializer(favs, many=True).data)


class ToggleFavoriteView(APIView):
    """POST /api/v1/products/<id>/favorite/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return api_error('NOT_FOUND', 'Producto no encontrado.', status.HTTP_404_NOT_FOUND)

        fav, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            fav.delete()
            return Response({'product_id': pk, 'is_favorite': False})
        return Response({'product_id': pk, 'is_favorite': True})
