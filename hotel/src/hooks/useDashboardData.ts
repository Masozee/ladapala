'use client';

import { useState, useEffect } from 'react';

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

      const apiUrl = process.env.NEXT_PUBLIC_DASHBOARD_API_URL;
      if (!apiUrl) {
        throw new Error('Dashboard API URL not configured');
      }

      const response = await fetch(apiUrl, {
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