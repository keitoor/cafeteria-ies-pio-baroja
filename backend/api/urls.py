from django.urls import path
from .views_auth import GoogleLoginView, StaffLoginView, RefreshTokenView, LogoutView, MeView
from .views_products import ProductListView, ProductDetailView, FavoritesView, ToggleFavoriteView
from .views_orders import OrderListView, OrderDetailView, OrderStatusView, OrderCancelView
from .views_payments import RedsysInitiateView, RedsysNotifyView
from .views_stats import StatsSummaryView, StatsSalesView, StatsTopProductsView

urlpatterns = [
    # Auth
    path('auth/google/', GoogleLoginView.as_view(), name='auth-google'),
    path('auth/staff/', StaffLoginView.as_view(), name='auth-staff'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),

    # Products
    path('products/', ProductListView.as_view(), name='products-list'),
    path('products/favorites/', FavoritesView.as_view(), name='products-favorites'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='products-detail'),
    path('products/<int:pk>/favorite/', ToggleFavoriteView.as_view(), name='products-toggle-fav'),

    # Orders
    path('orders/', OrderListView.as_view(), name='orders-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='orders-detail'),
    path('orders/<int:pk>/status/', OrderStatusView.as_view(), name='orders-status'),
    path('orders/<int:pk>/cancel/', OrderCancelView.as_view(), name='orders-cancel'),

    # Payments
    path('payments/redsys/initiate/', RedsysInitiateView.as_view(), name='payments-initiate'),
    path('payments/redsys/notify/', RedsysNotifyView.as_view(), name='payments-notify'),

    # Stats
    path('stats/summary/', StatsSummaryView.as_view(), name='stats-summary'),
    path('stats/sales/', StatsSalesView.as_view(), name='stats-sales'),
    path('stats/top-products/', StatsTopProductsView.as_view(), name='stats-top-products'),
]
