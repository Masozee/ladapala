from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.user.models import Employee, Department

User = get_user_model()


class Command(BaseCommand):
    help = 'Link an existing user to a new employee record'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email address')
        parser.add_argument('--department', type=str, default='Management', help='Department name')
        parser.add_argument('--position', type=str, default='Staff', help='Job position')
        parser.add_argument('--salary', type=float, default=0, help='Salary amount')

    def handle(self, *args, **options):
        email = options['email']
        department_name = options['department']
        position = options['position']
        salary = options['salary']

        try:
            # Get the user
            user = User.objects.get(email=email)

            # Check if user already has an employee record
            if hasattr(user, 'employee'):
                self.stdout.write(self.style.ERROR(f'User {email} already has an employee record!'))
                return

            # Get or create department
            department, created = Department.objects.get_or_create(
                name=department_name,
                defaults={'description': f'{department_name} Department'}
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Created department: {department_name}'))

            # Create employee record
            employee = Employee.objects.create(
                user=user,
                department=department,
                position=position,
                salary=salary,
                is_active=True
            )

            self.stdout.write(self.style.SUCCESS(
                f'Successfully linked user {email} to employee record {employee.employee_id}'
            ))
            self.stdout.write(f'Department: {department.name}')
            self.stdout.write(f'Position: {position}')
            self.stdout.write(f'Employee ID: {employee.employee_id}')

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} does not exist!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
