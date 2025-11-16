from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.restaurant.models import (
    Customer,
    LoyaltyTransaction,
    Reward,
    CustomerFeedback,
    MembershipTierBenefit,
    Staff,
    Branch
)
import random


class Command(BaseCommand):
    help = 'Seed CRM data: customers, loyalty transactions, rewards, feedback, and tier benefits'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting CRM data seeding...')

        # Get or create branch
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found. Please run seed_resto_data first.'))
            return

        # Get staff for feedback responses
        staff_members = list(Staff.objects.filter(branch=branch))
        if not staff_members:
            self.stdout.write(self.style.WARNING('No staff found. Feedback responses will not be assigned.'))

        # Clear existing CRM data
        self.stdout.write(self.style.WARNING('⚠ Clearing existing CRM data (customers, rewards, feedback, transactions)...'))
        self.stdout.write(self.style.WARNING('⚠ This will DELETE all existing CRM data!'))
        CustomerFeedback.objects.all().delete()
        LoyaltyTransaction.objects.all().delete()
        Reward.objects.all().delete()
        MembershipTierBenefit.objects.all().delete()
        Customer.objects.all().delete()

        # Create Membership Tier Benefits
        self.stdout.write('Creating membership tier benefits...')
        tier_benefits = [
            {
                'tier': 'BRONZE',
                'min_total_spent': Decimal('0'),
                'min_visits': 0,
                'points_multiplier': 1.0,
                'birthday_bonus_points': 100,
                'discount_percentage': Decimal('0')
            },
            {
                'tier': 'SILVER',
                'min_total_spent': Decimal('2000000'),
                'min_visits': 20,
                'points_multiplier': 1.2,
                'birthday_bonus_points': 250,
                'discount_percentage': Decimal('5')
            },
            {
                'tier': 'GOLD',
                'min_total_spent': Decimal('5000000'),
                'min_visits': 50,
                'points_multiplier': 1.5,
                'birthday_bonus_points': 500,
                'discount_percentage': Decimal('10')
            },
            {
                'tier': 'PLATINUM',
                'min_total_spent': Decimal('15000000'),
                'min_visits': 100,
                'points_multiplier': 2.0,
                'birthday_bonus_points': 1000,
                'discount_percentage': Decimal('15')
            }
        ]

        for benefit_data in tier_benefits:
            MembershipTierBenefit.objects.create(**benefit_data)

        self.stdout.write(self.style.SUCCESS(f'Created {len(tier_benefits)} tier benefits'))

        # Create Rewards
        self.stdout.write('Creating rewards...')
        rewards_data = [
            # Discounts
            {
                'name': 'Diskon 10%',
                'reward_type': 'DISCOUNT',
                'points_required': 100,
                'description': 'Dapatkan diskon 10% untuk pembelian berikutnya',
                'discount_type': 'PERCENTAGE',
                'discount_value': Decimal('10'),
                'stock_quantity': None,
                'is_active': True
            },
            {
                'name': 'Diskon 20%',
                'reward_type': 'DISCOUNT',
                'points_required': 250,
                'description': 'Dapatkan diskon 20% untuk pembelian berikutnya',
                'discount_type': 'PERCENTAGE',
                'discount_value': Decimal('20'),
                'stock_quantity': None,
                'is_active': True
            },
            {
                'name': 'Diskon Rp 50.000',
                'reward_type': 'DISCOUNT',
                'points_required': 500,
                'description': 'Diskon langsung Rp 50.000 untuk pembelian berikutnya',
                'discount_type': 'FIXED',
                'discount_value': Decimal('50000'),
                'stock_quantity': 20,
                'is_active': True
            },
            # Free Items (will need to link to products later)
            {
                'name': 'Free Appetizer',
                'reward_type': 'FREE_ITEM',
                'points_required': 150,
                'description': 'Pilih 1 appetizer gratis dari menu pilihan',
                'stock_quantity': 50,
                'is_active': True
            },
            {
                'name': 'Free Dessert',
                'reward_type': 'FREE_ITEM',
                'points_required': 200,
                'description': 'Pilih 1 dessert gratis dari menu pilihan',
                'stock_quantity': 50,
                'is_active': True
            },
            {
                'name': 'Free Main Course',
                'reward_type': 'FREE_ITEM',
                'points_required': 400,
                'description': 'Pilih 1 main course gratis (max Rp 75.000)',
                'stock_quantity': 30,
                'is_active': True
            },
            # Vouchers
            {
                'name': 'Voucher Rp 50.000',
                'reward_type': 'VOUCHER',
                'points_required': 300,
                'description': 'Voucher belanja senilai Rp 50.000',
                'voucher_code': 'VOUCHER50K',
                'voucher_value': Decimal('50000'),
                'stock_quantity': None,
                'is_active': True
            },
            {
                'name': 'Voucher Rp 100.000',
                'reward_type': 'VOUCHER',
                'points_required': 600,
                'description': 'Voucher belanja senilai Rp 100.000',
                'voucher_code': 'VOUCHER100K',
                'voucher_value': Decimal('100000'),
                'stock_quantity': None,
                'is_active': True
            },
            {
                'name': 'Voucher Rp 250.000',
                'reward_type': 'VOUCHER',
                'points_required': 1500,
                'description': 'Voucher belanja senilai Rp 250.000',
                'voucher_code': 'VOUCHER250K',
                'voucher_value': Decimal('250000'),
                'stock_quantity': 10,
                'is_active': True
            },
            {
                'name': 'Birthday Special',
                'reward_type': 'VOUCHER',
                'points_required': 100,
                'description': 'Kue ulang tahun gratis di bulan kelahiran Anda',
                'voucher_code': 'BIRTHDAY',
                'voucher_value': Decimal('0'),
                'stock_quantity': None,
                'is_active': True
            }
        ]

        for reward_data in rewards_data:
            Reward.objects.create(**reward_data)

        self.stdout.write(self.style.SUCCESS(f'Created {len(rewards_data)} rewards'))

        # Create Customers
        self.stdout.write('Creating customers...')
        customers_data = [
            # Bronze tier customers
            {'name': 'Ahmad Santoso', 'phone': '081234567801', 'email': 'ahmad.santoso@email.com', 'tier': 'BRONZE', 'points': 150, 'visits': 5, 'spent': '450000'},
            {'name': 'Siti Nurhaliza', 'phone': '081234567802', 'email': 'siti.nurhaliza@email.com', 'tier': 'BRONZE', 'points': 200, 'visits': 8, 'spent': '680000'},
            {'name': 'Budi Hartono', 'phone': '081234567803', 'email': 'budi.hartono@email.com', 'tier': 'BRONZE', 'points': 350, 'visits': 12, 'spent': '920000'},
            {'name': 'Dewi Lestari', 'phone': '081234567804', 'email': None, 'tier': 'BRONZE', 'points': 180, 'visits': 6, 'spent': '520000'},
            {'name': 'Eko Prasetyo', 'phone': '081234567805', 'email': 'eko.prasetyo@email.com', 'tier': 'BRONZE', 'points': 420, 'visits': 15, 'spent': '1150000'},

            # Silver tier customers
            {'name': 'Fitri Handayani', 'phone': '081234567806', 'email': 'fitri.handayani@email.com', 'tier': 'SILVER', 'points': 1250, 'visits': 28, 'spent': '2800000'},
            {'name': 'Gunawan Wijaya', 'phone': '081234567807', 'email': 'gunawan.wijaya@email.com', 'tier': 'SILVER', 'points': 1580, 'visits': 32, 'spent': '3200000'},
            {'name': 'Hana Kusuma', 'phone': '081234567808', 'email': 'hana.kusuma@email.com', 'tier': 'SILVER', 'points': 2100, 'visits': 45, 'spent': '4500000'},
            {'name': 'Indra Putra', 'phone': '081234567809', 'email': None, 'tier': 'SILVER', 'points': 1780, 'visits': 38, 'spent': '3650000'},

            # Gold tier customers
            {'name': 'Julia Rahmawati', 'phone': '081234567810', 'email': 'julia.rahmawati@email.com', 'tier': 'GOLD', 'points': 6200, 'visits': 85, 'spent': '8500000'},
            {'name': 'Kurniawan Setiawan', 'phone': '081234567811', 'email': 'kurniawan.setiawan@email.com', 'tier': 'GOLD', 'points': 7800, 'visits': 102, 'spent': '10200000'},
            {'name': 'Lina Marlina', 'phone': '081234567812', 'email': 'lina.marlina@email.com', 'tier': 'GOLD', 'points': 8500, 'visits': 115, 'spent': '11500000'},

            # Platinum tier customers
            {'name': 'Muhammad Rizki', 'phone': '081234567813', 'email': 'muhammad.rizki@email.com', 'tier': 'PLATINUM', 'points': 18500, 'visits': 205, 'spent': '22500000'},
            {'name': 'Nurul Aini', 'phone': '081234567814', 'email': 'nurul.aini@email.com', 'tier': 'PLATINUM', 'points': 22000, 'visits': 250, 'spent': '28000000'},
            {'name': 'Omar Abdullah', 'phone': '081234567815', 'email': 'omar.abdullah@email.com', 'tier': 'PLATINUM', 'points': 25500, 'visits': 300, 'spent': '35000000'},
        ]

        customers = []
        for customer_data in customers_data:
            tier = customer_data.pop('tier')
            points = customer_data.pop('points')
            visits = customer_data.pop('visits')
            spent = customer_data.pop('spent')

            customer = Customer.objects.create(
                name=customer_data['name'],
                phone_number=customer_data['phone'],
                email=customer_data['email'],
                membership_tier=tier,
                points_balance=points,
                lifetime_points=points + random.randint(100, 500),
                total_visits=visits,
                total_spent=Decimal(spent),
                is_active=True
            )
            customers.append(customer)

        self.stdout.write(self.style.SUCCESS(f'Created {len(customers)} customers'))

        # Create Loyalty Transactions
        self.stdout.write('Creating loyalty transactions...')
        transaction_count = 0
        for customer in customers:
            # Create some earn transactions
            num_earn = random.randint(3, 8)
            for i in range(num_earn):
                days_ago = random.randint(1, 90)
                amount = random.randint(50, 500)
                transaction = LoyaltyTransaction.objects.create(
                    customer=customer,
                    transaction_type='EARN',
                    points=amount,
                    balance_after=customer.points_balance,
                    description=f'Poin dari transaksi pembelian Rp {amount * 1000}'
                )
                transaction.created_at = timezone.now() - timedelta(days=days_ago)
                transaction.save()
                transaction_count += 1

            # Create some redeem transactions for higher tier customers
            if customer.membership_tier in ['GOLD', 'PLATINUM']:
                num_redeem = random.randint(1, 3)
                for i in range(num_redeem):
                    days_ago = random.randint(1, 60)
                    amount = random.choice([100, 150, 200, 300])
                    reward = random.choice(Reward.objects.all())
                    transaction = LoyaltyTransaction.objects.create(
                        customer=customer,
                        transaction_type='REDEEM',
                        points=-amount,
                        balance_after=customer.points_balance,
                        reward=reward,
                        description=f'Tukar poin untuk {reward.name}'
                    )
                    transaction.created_at = timezone.now() - timedelta(days=days_ago)
                    transaction.save()
                    transaction_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {transaction_count} loyalty transactions'))

        # Create Customer Feedback
        self.stdout.write('Creating customer feedback...')
        feedback_comments = [
            'Makanan sangat enak, pelayanan ramah dan cepat!',
            'Suasana restoran sangat nyaman, cocok untuk keluarga',
            'Menu variatif dan harga terjangkau',
            'Tempat favorit untuk makan siang bersama rekan kerja',
            'Kualitas makanan konsisten, selalu puas setiap berkunjung',
            'Porsi besar dan harga worth it',
            'Staff sangat membantu dalam memberikan rekomendasi menu',
            'Kebersihan terjaga dengan baik',
            'Parkir luas dan mudah diakses',
            'Akan kembali lagi dan merekomendasikan ke teman',
            'Makanan datang agak lama tapi worth the wait',
            'Harga sedikit mahal tapi sebanding dengan kualitas',
        ]

        feedback_count = 0
        for customer in random.sample(customers, min(12, len(customers))):
            days_ago = random.randint(1, 60)
            food_rating = random.randint(3, 5)
            service_rating = random.randint(3, 5)
            ambiance_rating = random.randint(3, 5)
            value_rating = random.randint(3, 5)
            overall_rating = (food_rating + service_rating + ambiance_rating + value_rating) / 4

            feedback = CustomerFeedback.objects.create(
                customer=customer,
                food_rating=food_rating,
                service_rating=service_rating,
                ambiance_rating=ambiance_rating,
                value_rating=value_rating,
                overall_rating=overall_rating,
                comment=random.choice(feedback_comments)
            )
            feedback.created_at = timezone.now() - timedelta(days=days_ago)
            feedback.save()

            # Add staff response to some feedback
            if random.random() > 0.5 and staff_members:
                staff = random.choice(staff_members)
                feedback.staff_response = f'Terima kasih atas feedback Anda! Kami senang Anda menikmati pengalaman di restoran kami.'
                feedback.responded_by = staff
                feedback.response_date = feedback.created_at + timedelta(days=random.randint(1, 3))
                feedback.save()

            feedback_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {feedback_count} customer feedback entries'))

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('CRM Data Seeding Complete!'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(f'Tier Benefits: {MembershipTierBenefit.objects.count()}')
        self.stdout.write(f'Rewards: {Reward.objects.count()}')
        self.stdout.write(f'Customers: {Customer.objects.count()}')
        self.stdout.write(f'  - Bronze: {Customer.objects.filter(membership_tier="BRONZE").count()}')
        self.stdout.write(f'  - Silver: {Customer.objects.filter(membership_tier="SILVER").count()}')
        self.stdout.write(f'  - Gold: {Customer.objects.filter(membership_tier="GOLD").count()}')
        self.stdout.write(f'  - Platinum: {Customer.objects.filter(membership_tier="PLATINUM").count()}')
        self.stdout.write(f'Loyalty Transactions: {LoyaltyTransaction.objects.count()}')
        self.stdout.write(f'Customer Feedback: {CustomerFeedback.objects.count()}')
        self.stdout.write(self.style.SUCCESS('='*50))
