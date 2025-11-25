'use client';

import { useQuery } from '@tanstack/react-query';
import { getWorkouts } from '@/app/actions/workout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function WorkoutChart() {
  const { data: workoutsData } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const result = await getWorkouts();
      if (result.error) throw new Error(result.error);
      return result.workouts;
    },
    staleTime: Infinity, // Данные никогда не устаревают - загрузка только 1 раз
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  const workouts = workoutsData || [];

  // Prepare data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayWorkouts = workouts.filter(
      (w) => format(new Date(w.date), 'yyyy-MM-dd') === dateStr
    );
    return {
      date: format(date, 'dd MMM'),
      duration: dayWorkouts.reduce((sum, w) => sum + w.duration, 0),
      count: dayWorkouts.length,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={last7Days}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
        />
        <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
        />
        <Line
          type="monotone"
          dataKey="duration"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
          name="Минуты"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

