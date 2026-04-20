import { MessageSquare, Smile, Frown, HelpCircle, Zap } from 'lucide-react';

interface Message {
  id: string;
  customer_name: string;
  channel: string;
  latest_message: string;
  latest_sentiment: string;
  created_at: string;
}

interface ChatTableProps {
  conversations: Message[];
}

const sentimentConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  'hài lòng': { icon: <Smile size={16} />, color: 'text-green-400', bg: 'bg-green-500/10' },
  'tức giận': { icon: <Frown size={16} />, color: 'text-red-400', bg: 'bg-red-500/10' },
  'hỏi han': { icon: <HelpCircle size={16} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'trung tính': { icon: <Zap size={16} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

export default function ChatTable({ conversations }: ChatTableProps) {
  const getSentimentBadge = (sentiment?: string) => {
    const config = sentiment ? sentimentConfig[sentiment] : null;
    
    if (!config) {
      return (
        <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
          N/A
        </span>
      );
    }

    return (
      <span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.color} flex items-center gap-1 w-fit`}>
        {config.icon}
        {sentiment}
      </span>
    );
  };

  const channelColors: Record<string, string> = {
    FACEBOOK: 'bg-blue-600/20 text-blue-300',
    WHATSAPP: 'bg-green-600/20 text-green-300',
    WEBSITE: 'bg-purple-600/20 text-purple-300',
    EMAIL: 'bg-orange-600/20 text-orange-300',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Khách hàng</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Kênh</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Tin nhắn gần đây</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Cảm xúc</th>
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conv: any, idx) => (
            <tr
              key={idx}
              data-conversation-id={conv.id}
              className="border-b border-slate-700 hover:bg-slate-700/50 transition cursor-pointer"
            >
              <td className="px-4 py-3 font-medium text-white group-hover:text-blue-300">
                👤 {conv.customer_name}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${channelColors[conv.channel] || 'bg-slate-700 text-slate-300'}`}>
                  {conv.channel}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                "{conv.latest_message}"
              </td>
              <td className="px-4 py-3">
                {getSentimentBadge(conv.latest_sentiment)}
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs">
                {new Date(conv.created_at).toLocaleDateString('vi-VN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
