import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MessageTrendData {
  date: string;
  count: number;
}

interface MessageTrendChartProps {
  data: MessageTrendData[];
}

export default function MessageTrendChart({ data }: MessageTrendChartProps) {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }),
    'Tin nhắn': item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          formatter={(value: any) => `${value} tin nhắn`}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Line
          type="monotone"
          dataKey="Tin nhắn"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
