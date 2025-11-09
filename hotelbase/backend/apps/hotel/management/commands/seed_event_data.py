from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.hotel.models import EventPackage, FoodPackage, EventBooking, EventPayment, Guest, Room
from decimal import Decimal
from datetime import date, time, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed event packages and food packages with Indonesian themes'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Seeding Event Data ==='))

        # Create Event Packages (Venue Packages)
        self.stdout.write('Creating Event Packages...')

        packages_data = [
            {
                'name': 'Paket Perunggu',
                'package_type': 'BRONZE',
                'description': 'Paket dasar untuk acara sederhana dengan fasilitas standar',
                'base_price': Decimal('3000000'),
                'includes_venue': True,
                'includes_sound_system': False,
                'includes_projector': False,
                'includes_led_screen': False,
                'includes_lighting': False,
                'includes_ac': True,
                'includes_tables_chairs': True,
                'includes_decoration': False,
                'includes_parking': False,
                'max_hours': 4,
                'additional_hour_price': Decimal('500000'),
            },
            {
                'name': 'Paket Perak',
                'package_type': 'SILVER',
                'description': 'Paket menengah dengan sound system dan AC untuk acara meeting atau arisan',
                'base_price': Decimal('5000000'),
                'includes_venue': True,
                'includes_sound_system': True,
                'includes_projector': False,
                'includes_led_screen': False,
                'includes_lighting': False,
                'includes_ac': True,
                'includes_tables_chairs': True,
                'includes_decoration': False,
                'includes_parking': True,
                'max_hours': 6,
                'additional_hour_price': Decimal('600000'),
            },
            {
                'name': 'Paket Emas',
                'package_type': 'GOLD',
                'description': 'Paket premium dengan sound system, proyektor, dan lighting untuk acara pernikahan atau seminar',
                'base_price': Decimal('8000000'),
                'includes_venue': True,
                'includes_sound_system': True,
                'includes_projector': True,
                'includes_led_screen': True,
                'includes_lighting': True,
                'includes_ac': True,
                'includes_tables_chairs': True,
                'includes_decoration': False,
                'includes_parking': True,
                'max_hours': 8,
                'additional_hour_price': Decimal('750000'),
            },
            {
                'name': 'Paket Platinum',
                'package_type': 'PLATINUM',
                'description': 'Paket mewah all-in dengan dekorasi dan semua fasilitas premium untuk acara spesial',
                'base_price': Decimal('12000000'),
                'includes_venue': True,
                'includes_sound_system': True,
                'includes_projector': True,
                'includes_led_screen': True,
                'includes_lighting': True,
                'includes_ac': True,
                'includes_tables_chairs': True,
                'includes_decoration': True,
                'includes_parking': True,
                'max_hours': 10,
                'additional_hour_price': Decimal('900000'),
            },
        ]

        for pkg_data in packages_data:
            pkg, created = EventPackage.objects.get_or_create(
                name=pkg_data['name'],
                defaults=pkg_data
            )
            if created:
                self.stdout.write(f'  ✓ Created: {pkg.name}')
            else:
                self.stdout.write(f'  - Already exists: {pkg.name}')

        # Create Food Packages (Indonesian cuisine)
        self.stdout.write('\nCreating Food Packages...')

        food_packages_data = [
            {
                'name': 'Paket Nasi Box Ekonomis',
                'category': 'LUNCH',
                'description': 'Paket praktis untuk meeting atau gathering',
                'price_per_pax': Decimal('35000'),
                'minimum_pax': 30,
                'menu_items': '''Menu:
- Nasi putih
- Ayam goreng/bakar
- Tempe orek
- Sambal
- Kerupuk
- Air mineral botol
- Buah potong''',
            },
            {
                'name': 'Paket Prasmanan Nusantara Standar',
                'category': 'LUNCH',
                'description': 'Prasmanan dengan menu masakan Indonesia untuk acara formal',
                'price_per_pax': Decimal('75000'),
                'minimum_pax': 50,
                'menu_items': '''Menu:
- Nasi putih
- Ayam goreng kalasan
- Rendang daging sapi
- Ikan goreng/bakar
- Sayur asem
- Tumis kangkung
- Sambal terasi
- Kerupuk udang
- Acar
- Es teh manis/jeruk
- Kue tradisional (2 jenis)
- Buah potong (semangka, melon, pepaya)''',
            },
            {
                'name': 'Paket Prasmanan Nusantara Premium',
                'category': 'LUNCH',
                'description': 'Prasmanan premium dengan pilihan menu lengkap untuk acara pernikahan atau gala dinner',
                'price_per_pax': Decimal('125000'),
                'minimum_pax': 100,
                'menu_items': '''Menu:
- Nasi putih & nasi kuning
- Ayam bakar madu
- Rendang daging sapi premium
- Gurame goreng/bakar
- Sop buntut
- Sayur lodeh
- Capcay seafood
- Tumis buncis
- Sambal terasi & sambal matah
- Kerupuk udang & emping
- Acar & asinan
- Es teh manis, jeruk, kelapa muda
- Kue tradisional (4 jenis): klepon, lemper, risoles, pastel
- Buah potong premium (semangka, melon, anggur, nanas)
- Puding/es krim''',
            },
            {
                'name': 'Paket Coffee Break Pagi',
                'category': 'COFFEE_BREAK',
                'description': 'Snack pagi untuk coffee break seminar atau workshop',
                'price_per_pax': Decimal('25000'),
                'minimum_pax': 30,
                'menu_items': '''Menu:
- Kopi/teh/susu
- Jus buah
- Roti bakar/donat
- Pisang goreng
- Onde-onde
- Kue basah (2 jenis)
- Buah potong''',
            },
            {
                'name': 'Paket Coffee Break Siang',
                'category': 'COFFEE_BREAK',
                'description': 'Snack siang untuk istirahat acara',
                'price_per_pax': Decimal('30000'),
                'minimum_pax': 30,
                'menu_items': '''Menu:
- Kopi/teh/susu
- Jus buah segar
- Risoles mayo
- Lemper ayam
- Tahu isi
- Kue lumpur
- Brownies
- Buah potong''',
            },
            {
                'name': 'Paket Sarapan Nusantara',
                'category': 'BREAKFAST',
                'description': 'Sarapan lengkap khas Indonesia untuk acara pagi',
                'price_per_pax': Decimal('45000'),
                'minimum_pax': 50,
                'menu_items': '''Menu:
- Nasi uduk
- Bubur ayam
- Nasi goreng
- Telur dadar/ceplok/rebus
- Ayam goreng kalasan
- Tempe & tahu goreng
- Sambal & kerupuk
- Kopi/teh/susu
- Jus jeruk/melon
- Buah potong''',
            },
            {
                'name': 'Paket Makan Malam Spesial',
                'category': 'DINNER',
                'description': 'Paket makan malam mewah untuk acara wedding atau gala dinner',
                'price_per_pax': Decimal('150000'),
                'minimum_pax': 100,
                'menu_items': '''Menu:
- Welcome drink (mocktail/jus segar)
- Nasi putih & nasi kuning
- Sup krim ayam jamur
- Ayam bakar madu bumbu kecap
- Rendang daging sapi premium
- Gurame asam manis/bakar
- Udang goreng mentega
- Sayur lodeh
- Capcay seafood premium
- Sambal terasi & matah
- Kerupuk udang & emping melinjo
- Acar & asinan buah
- Es teh manis, jeruk, kelapa muda, infused water
- Dessert: puding, es krim, kue tradisional (5 jenis)
- Buah potong premium (5 jenis)
- Coffee/tea station''',
            },
            {
                'name': 'Paket Tumpeng Syukuran',
                'category': 'LUNCH',
                'description': 'Paket nasi tumpeng untuk acara syukuran, peresmian, atau ulang tahun',
                'price_per_pax': Decimal('85000'),
                'minimum_pax': 50,
                'menu_items': '''Menu:
- Nasi kuning tumpeng (1 tumpeng besar untuk 50 pax)
- Ayam goreng kalasan
- Rendang daging sapi
- Telur pindang
- Perkedel kentang
- Sambal goreng ati
- Tumis buncis wortel
- Sambal terasi
- Kerupuk udang besar
- Urap sayur
- Serundeng kelapa
- Kering tempe
- Es teh manis/jeruk
- Kue tradisional
- Buah potong''',
            },
            {
                'name': 'Paket Koktail Buffet',
                'category': 'COCKTAIL',
                'description': 'Standing party dengan berbagai finger food untuk acara networking atau launching',
                'price_per_pax': Decimal('95000'),
                'minimum_pax': 75,
                'menu_items': '''Menu:
- Welcome mocktail/jus segar
- Risoles mayo
- Lemper ayam
- Pastel tutup
- Tahu isi
- Kroket kentang
- Sushi roll
- Spring roll sayur
- Chicken nugget
- Sate ayam bumbu kacang (mini)
- Perkedel kentang
- Martabak mini
- Pizza mini
- Kue-kue tradisional
- Brownies & cookies
- Buah potong premium
- Coffee/tea station
- Infused water''',
            },
        ]

        for food_data in food_packages_data:
            food, created = FoodPackage.objects.get_or_create(
                name=food_data['name'],
                defaults=food_data
            )
            if created:
                self.stdout.write(f'  ✓ Created: {food.name} - Rp {food.price_per_pax:,.0f}/pax')
            else:
                self.stdout.write(f'  - Already exists: {food.name}')

        self.stdout.write(self.style.SUCCESS(f'\n✓ Done! Created {EventPackage.objects.count()} event packages and {FoodPackage.objects.count()} food packages'))

        # Summary
        self.stdout.write(self.style.SUCCESS('\n=== Summary ==='))
        self.stdout.write(f'Event Packages: {EventPackage.objects.count()}')
        for pkg in EventPackage.objects.all():
            self.stdout.write(f'  - {pkg.name}: Rp {pkg.base_price:,.0f} ({pkg.max_hours} jam)')

        self.stdout.write(f'\nFood Packages: {FoodPackage.objects.count()}')
        for food in FoodPackage.objects.all():
            self.stdout.write(f'  - {food.name}: Rp {food.price_per_pax:,.0f}/pax (min {food.minimum_pax} pax)')
