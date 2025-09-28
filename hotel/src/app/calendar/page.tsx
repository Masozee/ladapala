'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
  Upload,
  Bell,
  User,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Star
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  status: string;
  priority: string;
  location?: string;
  room_number?: string;
  guest_name?: string;
  assigned_employee_name?: string;
  duration_hours: number;
}

interface Holiday {
  id: number;
  name: string;
  name_id: string;
  date: string;
  holiday_type: string;
  description?: string;
  is_work_day: boolean;
  is_today: boolean;
}

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from API
  const fetchEventsForMonth = async (month?: number, year?: number) => {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const response = await fetch(`http://localhost:8000/api/calendar/events/?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      console.error('Error fetching events:', err);
      return [];
    }
  };

  // Fetch holidays from API
  const fetchHolidaysForYear = async (year?: number) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      
      const response = await fetch(`http://localhost:8000/api/calendar/holidays/?${params}`);
      if (!response.ok) throw new Error('Failed to fetch holidays');
      
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      console.error('Error fetching holidays:', err);
      return [];
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Fetch events for current, previous, and next month
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
      
      const [currentEvents, prevEvents, nextEvents] = await Promise.all([
        fetchEventsForMonth(currentDate.getMonth() + 1, currentDate.getFullYear()),
        fetchEventsForMonth(prevMonth.getMonth() + 1, prevMonth.getFullYear()),
        fetchEventsForMonth(nextMonth.getMonth() + 1, nextMonth.getFullYear())
      ]);
      
      // Combine all events
      const allEvents = [...(currentEvents || []), ...(prevEvents || []), ...(nextEvents || [])];
      setEvents(allEvents);
      
      // Fetch holidays for current year and adjacent years if needed
      const years = [currentDate.getFullYear()];
      if (prevMonth.getFullYear() !== currentDate.getFullYear()) {
        years.push(prevMonth.getFullYear());
      }
      if (nextMonth.getFullYear() !== currentDate.getFullYear()) {
        years.push(nextMonth.getFullYear());
      }
      
      const holidayPromises = years.map(year => fetchHolidaysForYear(year));
      const holidayResults = await Promise.all(holidayPromises);
      const allHolidays = holidayResults.flat();
      setHolidays(allHolidays);
      
      setLoading(false);
    };

    loadData();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Previous month's days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevMonth = new Date(year, month - 1, 0);
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day)
      });
    }
    
    // Next month's days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, day)
      });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  const getHolidaysForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return holidays.filter(holiday => holiday.date === dateString);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'MEETING': return 'bg-blue-500';
      case 'RESERVATION': return 'bg-green-500';
      case 'MAINTENANCE': return 'bg-red-500';
      case 'HOUSEKEEPING': return 'bg-yellow-500';
      case 'STAFF_SCHEDULE': return 'bg-purple-500';
      case 'EVENT': return 'bg-pink-500';
      case 'REMINDER': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'MEETING': return 'Meeting';
      case 'RESERVATION': return 'Reservation';
      case 'MAINTENANCE': return 'Maintenance';
      case 'HOUSEKEEPING': return 'Housekeeping';
      case 'STAFF_SCHEDULE': return 'Staff Schedule';
      case 'EVENT': return 'Hotel Event';
      case 'REMINDER': return 'Reminder';
      default: return 'Event';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(event => event.event_type === filterType);

  const navigateMonth = async (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  // Mini calendar helper functions
  const getMiniCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Previous month's days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevMonth = new Date(year, month - 1, 0);
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day)
      });
    }
    
    // Next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, day)
      });
    }
    
    return days;
  };

  const MiniCalendar = ({ date, title, onDateClick }: { date: Date, title: string, onDateClick: (date: Date) => void }) => {
    const miniDays = getMiniCalendarDays(date);
    
    // Count events and holidays for this month
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
    });
    
    const monthHolidays = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getMonth() === date.getMonth() && holidayDate.getFullYear() === date.getFullYear();
    });
    
    return (
      <div className="bg-white shadow">
        <div className="p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 text-center">{title}</h4>
          <p className="text-sm text-gray-500 text-center">
            {monthNames[date.getMonth()]} {date.getFullYear()}
          </p>
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-[#005357] rounded-full"></div>
              <span>{monthEvents.length} events</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-red-500" />
              <span>{monthHolidays.length} holidays</span>
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="text-xs text-gray-500 text-center p-1 font-medium">
                {day}
              </div>
            ))}
            {miniDays.slice(0, 42).map((day, index) => {
              const hasEvents = getEventsForDate(day.fullDate).length > 0;
              const hasHolidays = getHolidaysForDate(day.fullDate).length > 0;
              return (
                <button
                  key={index}
                  onClick={() => onDateClick(day.fullDate)}
                  className={`text-xs p-1 text-center transition-colors hover:bg-gray-100 relative ${
                    !day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'
                  } ${
                    isToday(day.fullDate) ? 'bg-blue-100 text-blue-600 font-medium' : ''
                  } ${
                    isSelected(day.fullDate) ? 'bg-[#005357] text-white' : ''
                  }`}
                >
                  {day.date}
                  {hasEvents && day.isCurrentMonth && (
                    <div className="w-1 h-1 bg-[#005357] rounded-full mx-auto mt-0.5"></div>
                  )}
                  {hasHolidays && day.isCurrentMonth && (
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getPrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    return prev;
  };

  const getNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    return next;
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex space-x-6">
        {/* Main Calendar Area */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="bg-[#005357] text-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Calendar</h1>
                <p className="text-white/80 mt-2">Manage your schedule and hotel events</p>
                {error && (
                  <p className="text-red-200 text-sm mt-1">{error}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none transition-colors text-sm"
                  >
                    <option value="all" className="text-gray-900">All Events</option>
                    <option value="MEETING" className="text-gray-900">Meetings</option>
                    <option value="RESERVATION" className="text-gray-900">Reservations</option>
                    <option value="MAINTENANCE" className="text-gray-900">Maintenance</option>
                    <option value="HOUSEKEEPING" className="text-gray-900">Housekeeping</option>
                    <option value="STAFF_SCHEDULE" className="text-gray-900">Staff Schedule</option>
                    <option value="EVENT" className="text-gray-900">Hotel Events</option>
                  </select>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Add Event</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Controls */}
        <div className="bg-white shadow">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-white/20 transition-colors text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-white/20 transition-colors text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex bg-white/10">
                  {['month', 'week', 'day'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as 'month' | 'week' | 'day')}
                      className={`px-4 py-2 text-sm capitalize transition-colors ${
                        viewMode === mode
                          ? 'bg-white text-[#005357] font-medium'
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-1">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {days.map((day, index) => {
                  const dayEvents = getEventsForDate(day.fullDate);
                  const dayHolidays = getHolidaysForDate(day.fullDate);
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day.fullDate)}
                      className={`min-h-[100px] p-2 cursor-pointer transition-colors relative ${
                        !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                      } ${
                        isToday(day.fullDate) ? 'bg-blue-50' : ''
                      } ${
                        isSelected(day.fullDate) ? 'bg-[#005357]/10' : ''
                      } hover:bg-gray-50`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday(day.fullDate) ? 'text-blue-600' : ''
                      }`}>
                        {day.date}
                        {dayHolidays.length > 0 && (
                          <Star className="h-3 w-3 text-red-500 inline ml-1" />
                        )}
                      </div>
                      
                      {/* Display holidays */}
                      {dayHolidays.map((holiday) => (
                        <div
                          key={holiday.id}
                          className="px-1 py-0.5 text-xs bg-red-100 text-red-700 truncate mb-1 border-l-2 border-red-500"
                          title={holiday.name_id}
                        >
                          {holiday.name}
                        </div>
                      ))}
                      
                      {/* Display events */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setShowEventDialog(true);
                            }}
                            className={`px-1 py-0.5 text-xs text-white truncate cursor-pointer hover:opacity-80 ${getEventTypeColor(event.event_type)}`}
                          >
                            {formatTime(event.start_datetime)} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white shadow">
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <p className="text-sm text-gray-500 mt-1">Next 7 days across all months</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(() => {
                // Get truly upcoming events from the next 7 days
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                
                const upcomingEvents = events
                  .filter(event => {
                    const eventDate = new Date(event.start_datetime);
                    return eventDate >= today && eventDate <= nextWeek;
                  })
                  .filter(event => filterType === 'all' || event.event_type === filterType)
                  .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
                  .slice(0, 5);
                
                return upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-4 p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.event_type)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(event.priority)}`}>
                        {event.priority.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{event.description || 'No description'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(event.start_datetime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(event.start_datetime)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.room_number && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>Room {event.room_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDialog(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No upcoming events in the next 7 days</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filter or check other months</p>
                </div>
              );
              })()}
            </div>
          </div>
        </div>

        {/* Event Details Dialog */}
        <Dialog.Root open={showEventDialog} onOpenChange={setShowEventDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-[10%] left-1/2 transform -translate-x-1/2 bg-white shadow-lg max-w-lg w-full mx-4 z-50">
              {selectedEvent && (
                <>
                  <div className="p-6 bg-[#005357] text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                        <p className="text-sm text-gray-100 mt-1">{getEventTypeText(selectedEvent.event_type)}</p>
                      </div>
                      <Dialog.Close asChild>
                        <button className="p-1 hover:bg-white/20 text-white">
                          <X className="h-5 w-5" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-600">{selectedEvent.description || 'No description provided'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Date & Time</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(selectedEvent.start_datetime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(selectedEvent.start_datetime)} ({selectedEvent.duration_hours}h)</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedEvent.location || selectedEvent.room_number ? `Room ${selectedEvent.room_number}` : 'No location specified'}</span>
                          </div>
                        </div>
                      </div>
                      {(selectedEvent.guest_name || selectedEvent.assigned_employee_name) && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">People</h4>
                          <div className="space-y-1">
                            {selectedEvent.guest_name && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-3 w-3" />
                                <span>Guest: {selectedEvent.guest_name}</span>
                              </div>
                            )}
                            {selectedEvent.assigned_employee_name && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-3 w-3" />
                                <span>Assigned: {selectedEvent.assigned_employee_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Status & Priority</h4>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs rounded ${
                            selectedEvent.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            selectedEvent.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            selectedEvent.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {selectedEvent.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(selectedEvent.priority)}`}>
                            {selectedEvent.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                        Edit Event
                      </button>
                      <button className="px-4 py-2 bg-[#005357] text-white hover:bg-[#004147] transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 space-y-6">
          {/* Previous Month */}
          <MiniCalendar
            date={getPrevMonth()}
            title="Previous Month"
            onDateClick={(date) => {
              setSelectedDate(date);
              setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
          />

          {/* Next Month */}
          <MiniCalendar
            date={getNextMonth()}
            title="Next Month"
            onDateClick={(date) => {
              setSelectedDate(date);
              setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
          />

          {/* Next Month Highlights */}
          {(() => {
            const nextMonth = getNextMonth();
            const nextMonthEvents = events
              .filter(event => {
                const eventDate = new Date(event.start_datetime);
                return eventDate.getMonth() === nextMonth.getMonth() && 
                       eventDate.getFullYear() === nextMonth.getFullYear();
              })
              .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
              .slice(0, 3);
              
            const nextMonthHolidays = holidays
              .filter(holiday => {
                const holidayDate = new Date(holiday.date);
                return holidayDate.getMonth() === nextMonth.getMonth() && 
                       holidayDate.getFullYear() === nextMonth.getFullYear();
              })
              .slice(0, 2);

            if (nextMonthEvents.length === 0 && nextMonthHolidays.length === 0) return null;

            return (
              <div className="bg-white shadow">
                <div className="p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900">
                    {monthNames[nextMonth.getMonth()]} Highlights
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  {/* Holidays */}
                  {nextMonthHolidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center space-x-2 text-sm">
                      <Star className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{holiday.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(holiday.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Events */}
                  {nextMonthEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2 text-sm">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getEventTypeColor(event.event_type)}`}></div>
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.start_datetime).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {formatTime(event.start_datetime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Quick Stats */}
          <div className="bg-white shadow">
            <div className="p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900">This Month</h4>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Meetings</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {events.filter(e => e.event_type === 'MEETING').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Reservations</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {events.filter(e => e.event_type === 'RESERVATION').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Maintenance</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {events.filter(e => e.event_type === 'MAINTENANCE').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Housekeeping</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {events.filter(e => e.event_type === 'HOUSEKEEPING').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Staff</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {events.filter(e => e.event_type === 'STAFF_SCHEDULE').length}
                </span>
              </div>
            </div>
          </div>

          {/* Indonesian Holidays */}
          <div className="bg-white shadow">
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Indonesian Holidays</h4>
                <Star className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <div className="p-4">
              {holidays.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {holidays
                    .filter(holiday => new Date(holiday.date).getFullYear() === currentDate.getFullYear())
                    .slice(0, 10)
                    .map((holiday) => (
                    <div key={holiday.id} className="p-2 bg-red-50 border-l-4 border-red-500">
                      <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{holiday.name_id}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(holiday.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'short'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No holidays this year</p>
              )}
            </div>
          </div>

          {/* Today's Events */}
          <div className="bg-white shadow">
            <div className="p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900">Today's Events</h4>
            </div>
            <div className="p-4">
              {getEventsForDate(new Date()).length > 0 ? (
                <div className="space-y-2">
                  {getEventsForDate(new Date()).map((event) => (
                    <div key={event.id} className="p-2 bg-gray-50 border-l-4 border-[#005357]">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatTime(event.start_datetime)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No events today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;