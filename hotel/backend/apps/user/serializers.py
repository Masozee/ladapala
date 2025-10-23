from rest_framework import serializers
from .models import User, UserProfile, Department, Employee, Shift, Attendance


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile"""
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'role', 'avatar', 'avatar_url',
            'bio', 'phone', 'address', 'date_of_birth',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
        return None


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User"""
    full_name = serializers.CharField(read_only=True)
    profile = UserProfileSerializer(source='userprofile', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'is_staff', 'is_superuser', 'is_active',
            'date_joined', 'last_login', 'profile'
        ]
        read_only_fields = ['email', 'is_staff', 'is_superuser', 'date_joined', 'last_login']


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user basic info"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    class Meta:
        model = UserProfile
        fields = ['phone', 'bio', 'address', 'date_of_birth', 'avatar']


class ShiftSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    shift_type_display = serializers.CharField(source='get_shift_type_display', read_only=True)
    hours_scheduled = serializers.ReadOnlyField()
    has_attendance = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display', 'shift_date',
            'start_time', 'end_time', 'shift_type', 'shift_type_display',
            'break_duration', 'hours_scheduled', 'has_attendance', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'hours_scheduled']

    def get_has_attendance(self, obj):
        """Check if attendance record exists for this shift"""
        try:
            return obj.attendance is not None
        except:
            return False
