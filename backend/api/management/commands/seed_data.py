from django.core.management.base import BaseCommand
from api.models import User, Product

PRODUCTS = [
    {'name': 'Bocadillo de jamón', 'description': 'Baguette con jamón serrano', 'price': 2.50,
     'category': 'bocadillos', 'emoji': '🥖', 'stock': 20, 'available': True},
    {'name': 'Bocadillo de queso', 'description': 'Baguette con queso gouda', 'price': 2.20,
     'category': 'bocadillos', 'emoji': '🧀', 'stock': 15, 'available': True},
    {'name': 'Bocadillo mixto', 'description': 'Jamón y queso fundido', 'price': 2.80,
     'category': 'bocadillos', 'emoji': '🥪', 'stock': 10, 'available': True},
    {'name': 'Agua mineral', 'description': 'Botella 500ml', 'price': 0.80,
     'category': 'bebidas', 'emoji': '💧', 'stock': 50, 'available': True},
    {'name': 'Zumo de naranja', 'description': 'Natural recién exprimido 250ml', 'price': 1.50,
     'category': 'bebidas', 'emoji': '🍊', 'stock': 20, 'available': True},
    {'name': 'Café con leche', 'description': 'Café doble con leche entera', 'price': 1.20,
     'category': 'bebidas', 'emoji': '☕', 'stock': 30, 'available': True},
    {'name': 'Croissant', 'description': 'Croissant de mantequilla', 'price': 1.30,
     'category': 'bolleria', 'emoji': '🥐', 'stock': 25, 'available': True},
    {'name': 'Napolitana de chocolate', 'description': 'Hojaldre relleno de chocolate', 'price': 1.50,
     'category': 'bolleria', 'emoji': '🍫', 'stock': 20, 'available': True},
    {'name': 'Muffin de arándanos', 'description': 'Esponjoso muffin artesanal', 'price': 1.80,
     'category': 'bolleria', 'emoji': '🫐', 'stock': 15, 'available': True},
    {'name': 'Ensalada César', 'description': 'Lechuga, pollo, parmesano y croutones', 'price': 3.50,
     'category': 'ensaladas', 'emoji': '🥗', 'stock': 8, 'available': True},
    {'name': 'Flan casero', 'description': 'Flan de huevo con caramelo', 'price': 1.20,
     'category': 'postres', 'emoji': '🍮', 'stock': 12, 'available': True},
    {'name': 'Fruta del tiempo', 'description': 'Pieza de fruta de temporada', 'price': 0.80,
     'category': 'postres', 'emoji': '🍎', 'stock': 20, 'available': True},
]

class Command(BaseCommand):
    help = 'Seed de datos iniciales'

    def handle(self, *args, **options):
        staff, created = User.objects.get_or_create(
            email='admin@iespiobaroja.es',
            defaults={'name': 'Admin Cafetería', 'role': 'staff', 'is_staff': True}
        )
        if created or not staff.has_usable_password():
            staff.set_password('admin1234')
            staff.save()
            self.stdout.write(self.style.SUCCESS('Staff creado: admin@iespiobaroja.es / admin1234'))

        count = 0
        for p in PRODUCTS:
            _, created = Product.objects.get_or_create(name=p['name'], defaults=p)
            if created:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'{count} productos creados.'))
