from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
import os
from django.conf import settings

from ..models import RoomType, Room, RoomTypeImage
from ..serializers import (
    RoomTypeSerializer, RoomSerializer, RoomListSerializer
)


class RoomTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing room types"""
    queryset = RoomType.objects.all()
    serializer_class = RoomTypeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'max_occupancy']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'base_price', 'max_occupancy', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active room types"""
        room_types = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(room_types, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_images(self, request, pk=None):
        """Upload images for a room type"""
        room_type = self.get_object()
        images = request.FILES.getlist('images')

        if not images:
            return Response(
                {'error': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_images = []
        for image in images:
            room_image = RoomTypeImage.objects.create(
                room_type=room_type,
                image=image
            )
            uploaded_images.append({
                'id': room_image.id,
                'image_url': request.build_absolute_uri(room_image.image.url)
            })

        return Response({
            'message': f'{len(uploaded_images)} images uploaded successfully',
            'images': uploaded_images
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def delete_images(self, request, pk=None):
        """Delete images for a room type"""
        room_type = self.get_object()
        image_urls = request.data.get('images', [])

        if not image_urls:
            return Response(
                {'error': 'No images specified for deletion'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_count = 0
        for image_url in image_urls:
            # Extract the path from the URL
            if '/media/' in image_url:
                image_path = image_url.split('/media/')[-1]
                try:
                    room_image = RoomTypeImage.objects.get(
                        room_type=room_type,
                        image=image_path
                    )
                    # Delete the file from storage
                    if room_image.image:
                        if os.path.isfile(room_image.image.path):
                            os.remove(room_image.image.path)
                    room_image.delete()
                    deleted_count += 1
                except RoomTypeImage.DoesNotExist:
                    continue

        return Response({
            'message': f'{deleted_count} images deleted successfully',
            'deleted_count': deleted_count
        })


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for managing rooms"""
    queryset = Room.objects.select_related('room_type')
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['room_type', 'floor', 'status', 'is_active']
    search_fields = ['number', 'room_type__name']
    ordering_fields = ['number', 'floor', 'created_at']
    ordering = ['number']

    def get_serializer_class(self):
        if self.action == 'list':
            return RoomListSerializer
        return RoomSerializer

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available rooms for check-in"""
        available_rooms = self.get_queryset().filter(
            status='AVAILABLE',
            is_active=True
        )
        serializer = RoomListSerializer(available_rooms, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_floor(self, request):
        """Get rooms grouped by floor"""
        floor = request.query_params.get('floor')
        if floor:
            try:
                floor = int(floor)
                rooms = self.get_queryset().filter(floor=floor)
                serializer = RoomListSerializer(rooms, many=True)
                return Response({
                    'floor': floor,
                    'rooms': serializer.data
                })
            except ValueError:
                return Response({'error': 'Invalid floor number'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        # Group all rooms by floor
        rooms_by_floor = {}
        for room in self.get_queryset():
            if room.floor not in rooms_by_floor:
                rooms_by_floor[room.floor] = []
            rooms_by_floor[room.floor].append(RoomListSerializer(room).data)
        
        return Response(rooms_by_floor)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update room status"""
        from ..models import Reservation

        room = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response({'error': 'status field is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Validate status choice
        valid_statuses = [choice[0] for choice in Room.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'},
                          status=status.HTTP_400_BAD_REQUEST)

        # If changing to AVAILABLE, validate payment and checkout any checked-in guests
        if new_status == 'AVAILABLE':
            # Check if there are any unpaid checked-in reservations
            checked_in_reservations = Reservation.objects.filter(
                room=room,
                status='CHECKED_IN'
            )

            # Check each reservation's payment status
            for reservation in checked_in_reservations:
                if not reservation.is_fully_paid():
                    return Response({
                        'error': 'Cannot check out: Payment not completed',
                        'message': f'Reservation {reservation.reservation_number} must be fully paid before checkout',
                        'reservation_number': reservation.reservation_number,
                        'is_fully_paid': False
                    }, status=status.HTTP_400_BAD_REQUEST)

            # All reservations are paid, proceed with checkout
            checked_in_reservations.update(status='CHECKED_OUT')

        room.status = new_status
        room.save(update_fields=['status', 'updated_at'])

        serializer = RoomListSerializer(room)
        return Response(serializer.data)