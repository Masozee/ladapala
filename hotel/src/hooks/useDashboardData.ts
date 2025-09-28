'use client';

import { useState, useEffect } from 'react';
import { buildApiUrl } from '@/lib/config';

interface BasicMetrics {
  total_rooms: number;
  occupancy_rate: number;
  active_guests: number;
  todays_checkins: number;
  adr: number;
  revpar: number;
}

interface DemographicData {
  nationality: string;
  count: number;
  percentage: number;
}

interface WeeklyData {
  day: string;
  date: string;
  occupancy: number;
  occupied_rooms: number;
}

interface WeeklyComparison {
  current_week: {
    period: string;
    data: WeeklyData[];
  };
  previous_month_week: {
    period: string;
    data: WeeklyData[];
  };
}

interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  type: string;
  location: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  type: string;
  location: string;
  status: string;
  all_day: boolean;
}

interface Holiday {
  id: number;
  name: string;
  name_id: string;
  date: string;
  type: string;
  description: string;
}

interface DashboardData {
  basic_metrics: BasicMetrics;
  visitor_demographics: {
    total_visitors: number;
    data: DemographicData[];
  };
  weekly_comparison: WeeklyComparison;
  latest_news: NewsItem[];
  upcoming_events: CalendarEvent[];
  holidays_this_month: Holiday[];
  last_updated: string;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(buildApiUrl('hotel/main/'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Dashboard API Error:', err);
      
      // Set fallback data if API fails
      setData({
        basic_metrics: {
          total_rooms: 150,
          occupancy_rate: 75,
          active_guests: 112,
          todays_checkins: 8,
          adr: 850000,
          revpar: 637500
        },
        visitor_demographics: {
          total_visitors: 112,
          data: [
            { nationality: 'Indonesia', count: 45, percentage: 40 },
            { nationality: 'Singapore', count: 23, percentage: 20 },
            { nationality: 'Malaysia', count: 18, percentage: 16 },
            { nationality: 'Australia', count: 14, percentage: 12 },
            { nationality: 'Others', count: 12, percentage: 12 }
          ]
        },
        weekly_comparison: {
          current_week: {
            period: 'Current Week',
            data: [
              { day: 'Monday', date: '2024-01-15', occupancy: 72, occupied_rooms: 108 },
              { day: 'Tuesday', date: '2024-01-16', occupancy: 68, occupied_rooms: 102 },
              { day: 'Wednesday', date: '2024-01-17', occupancy: 75, occupied_rooms: 112 },
              { day: 'Thursday', date: '2024-01-18', occupancy: 80, occupied_rooms: 120 },
              { day: 'Friday', date: '2024-01-19', occupancy: 85, occupied_rooms: 127 },
              { day: 'Saturday', date: '2024-01-20', occupancy: 90, occupied_rooms: 135 },
              { day: 'Sunday', date: '2024-01-21', occupancy: 78, occupied_rooms: 117 }
            ]
          },
          previous_month_week: {
            period: 'Previous Month',
            data: [
              { day: 'Monday', date: '2023-12-18', occupancy: 78, occupied_rooms: 117 },
              { day: 'Tuesday', date: '2023-12-19', occupancy: 74, occupied_rooms: 111 },
              { day: 'Wednesday', date: '2023-12-20', occupancy: 82, occupied_rooms: 123 },
              { day: 'Thursday', date: '2023-12-21', occupancy: 88, occupied_rooms: 132 },
              { day: 'Friday', date: '2023-12-22', occupancy: 92, occupied_rooms: 138 },
              { day: 'Saturday', date: '2023-12-23', occupancy: 95, occupied_rooms: 142 },
              { day: 'Sunday', date: '2023-12-24', occupancy: 85, occupied_rooms: 127 }
            ]
          }
        },
        latest_news: [
          {
            id: 1,
            title: 'New WiFi Upgrade Completed',
            description: 'High-speed internet now available in all rooms',
            date: '2024-01-20',
            time: '09:00',
            type: 'system',
            location: 'All Areas'
          },
          {
            id: 2,
            title: 'Restaurant Menu Update',
            description: 'New seasonal dishes available',
            date: '2024-01-19',
            time: '18:30',
            type: 'food',
            location: 'Restaurant'
          }
        ],
        upcoming_events: [],
        holidays_this_month: [],
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refetch = () => {
    fetchDashboardData();
  };

  return { data, loading, error, refetch };
}