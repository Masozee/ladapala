from django.core.management.base import BaseCommand
from apps.calendars.models import Holiday
from datetime import datetime


class Command(BaseCommand):
    help = 'Load Indonesian national holidays for 2025'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            default=2025,
            help='Year to load holidays for (default: 2025)',
        )

    def handle(self, *args, **options):
        year = options['year']
        
        # Indonesian holidays for 2025
        holidays_2025 = [
            {
                'name': 'New Year 2025',
                'name_id': 'Tahun Baru 2025 Masehi',
                'date': '2025-01-01',
                'holiday_type': 'NATIONAL',
                'description': 'Perayaan tahun baru Masehi'
            },
            {
                'name': 'Isra Miraj of Prophet Muhammad',
                'name_id': 'Isra Mikraj Nabi Muhammad SAW',
                'date': '2025-01-27',
                'holiday_type': 'RELIGIOUS',
                'description': 'Peringatan Isra Miraj Nabi Muhammad SAW'
            },
            {
                'name': 'Chinese New Year 2576 Kongzili',
                'name_id': 'Tahun Baru Imlek 2576 Kongzili',
                'date': '2025-01-29',
                'holiday_type': 'RELIGIOUS',
                'description': 'Perayaan tahun baru Imlek'
            },
            {
                'name': 'Nyepi Day (Saka New Year 1947)',
                'name_id': 'Hari Suci Nyepi Tahun Baru Saka 1947',
                'date': '2025-03-29',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari raya suci agama Hindu'
            },
            {
                'name': 'Eid al-Fitr 1446 Hijriyah (Day 1)',
                'name_id': 'Hari Raya Idul Fitri 1446 Hijriyah',
                'date': '2025-03-31',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari raya umat Islam setelah bulan Ramadan'
            },
            {
                'name': 'Eid al-Fitr 1446 Hijriyah (Day 2)',
                'name_id': 'Hari Raya Idul Fitri 1446 Hijriyah',
                'date': '2025-04-01',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari raya umat Islam setelah bulan Ramadan (hari kedua)'
            },
            {
                'name': 'Good Friday',
                'name_id': 'Wafat Yesus Kristus',
                'date': '2025-04-18',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari peringatan kematian Yesus Kristus'
            },
            {
                'name': 'Easter Sunday',
                'name_id': 'Kebangkitan Yesus Kristus (Paskah)',
                'date': '2025-04-20',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari peringatan kebangkitan Yesus Kristus'
            },
            {
                'name': 'International Labor Day',
                'name_id': 'Hari Buruh Internasional',
                'date': '2025-05-01',
                'holiday_type': 'NATIONAL',
                'description': 'Hari Buruh Sedunia'
            },
            {
                'name': 'Vesak Day 2569 BE',
                'name_id': 'Hari Raya Waisak 2569 BE',
                'date': '2025-05-12',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari raya umat Buddha'
            },
            {
                'name': 'Ascension Day of Jesus Christ',
                'name_id': 'Kenaikan Yesus Kristus',
                'date': '2025-05-29',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari peringatan kenaikan Yesus Kristus ke surga'
            },
            {
                'name': 'Pancasila Day',
                'name_id': 'Hari Lahir Pancasila',
                'date': '2025-06-01',
                'holiday_type': 'NATIONAL',
                'description': 'Hari lahir ideologi Pancasila'
            },
            {
                'name': 'Eid al-Adha 1446 Hijriyah',
                'name_id': 'Hari Raya Idul Adha 1446 Hijriyah',
                'date': '2025-06-06',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari raya kurban umat Islam'
            },
            {
                'name': 'Islamic New Year 1447 Hijriyah',
                'name_id': 'Tahun Baru Islam 1447 Hijriyah',
                'date': '2025-06-27',
                'holiday_type': 'RELIGIOUS',
                'description': 'Tahun baru Islam atau Muharram'
            },
            {
                'name': 'Indonesian Independence Day',
                'name_id': 'Hari Kemerdekaan Republik Indonesia',
                'date': '2025-08-17',
                'holiday_type': 'NATIONAL',
                'description': 'Hari kemerdekaan Republik Indonesia'
            },
            {
                'name': 'Birthday of Prophet Muhammad',
                'name_id': 'Maulid Nabi Muhammad SAW',
                'date': '2025-09-05',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari peringatan kelahiran Nabi Muhammad SAW'
            },
            {
                'name': 'Christmas Day',
                'name_id': 'Hari Raya Natal',
                'date': '2025-12-25',
                'holiday_type': 'RELIGIOUS',
                'description': 'Hari perayaan kelahiran Yesus Kristus'
            }
        ]

        if year == 2025:
            holidays_data = holidays_2025
        else:
            self.stdout.write(
                self.style.WARNING(f'Holiday data not available for year {year}')
            )
            return

        created_count = 0
        updated_count = 0

        for holiday_data in holidays_data:
            date_obj = datetime.strptime(holiday_data['date'], '%Y-%m-%d').date()
            
            holiday, created = Holiday.objects.get_or_create(
                date=date_obj,
                name=holiday_data['name'],
                defaults={
                    'name_id': holiday_data['name_id'],
                    'holiday_type': holiday_data['holiday_type'],
                    'description': holiday_data['description'],
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f"Created: {holiday.name} on {holiday.date}")
            else:
                # Update existing holiday if needed
                if holiday.name_id != holiday_data['name_id'] or \
                   holiday.holiday_type != holiday_data['holiday_type'] or \
                   holiday.description != holiday_data['description']:
                    
                    holiday.name_id = holiday_data['name_id']
                    holiday.holiday_type = holiday_data['holiday_type']
                    holiday.description = holiday_data['description']
                    holiday.save()
                    updated_count += 1
                    self.stdout.write(f"Updated: {holiday.name} on {holiday.date}")

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed Indonesian holidays for {year}: '
                f'{created_count} created, {updated_count} updated'
            )
        )