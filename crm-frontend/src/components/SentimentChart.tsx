import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SentimentData {
  sentiment: string;
  count: number;
}

interface SentimentChartProps {
  data: SentimentData[];
}

const COLORS = {
  'hài lòng': '#10b981',
  'tức giận': '#ef4444',
  'hỏi han': '#3b82f6',
  'trung tính': '#f59e0b',
};

export default function SentimentChart({ data }: SentimentChartProps) {
  const chartData = data.map(item => ({
    name: item.sentiment,
    value: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => `${value} tin nhắn`}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend wrapperStyle={{ color: '#cbd5e1' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
