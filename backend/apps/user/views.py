from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User


class CustomAuthToken(ObtainAuthToken):
    """Custom authentication token view that returns user info along with token"""
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                          context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Get employee info if available
        employee_info = None
        if hasattr(user, 'employee'):
            employee = user.employee
            employee_info = {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'full_name': employee.full_name,
                'position': employee.position,
                'department': {
                    'id': employee.department.id,
                    'name': employee.department.name
                } if employee.department else None
            }
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'full_name': user.get_full_name(),
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            },
            'employee': employee_info
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """Logout endpoint that deletes the user's token"""
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response({'message': 'No active session found'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_profile(request):
    """Get current user profile"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Get employee info if available
    employee_info = None
    if hasattr(request.user, 'employee'):
        employee = request.user.employee
        employee_info = {
            'id': employee.id,
            'employee_id': employee.employee_id,
            'full_name': employee.full_name,
            'position': employee.position,
            'department': {
                'id': employee.department.id,
                'name': employee.department.name
            } if employee.department else None
        }
    
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'full_name': request.user.get_full_name(),
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser,
        },
        'employee': employee_info
    })