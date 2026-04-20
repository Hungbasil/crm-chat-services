import { Circle, Clock } from 'lucide-react';

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface StaffListProps {
  staff: StaffMember[];
}

export default function StaffList({ staff }: StaffListProps) {
  const isOnline = (createdAt: string) => {
    const lastActive = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return (now - lastActive) < 5 * 60 * 1000; // Online nếu active trong 5 phút gần đây
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { bg: string; color: string; label: string }> = {
      ADMIN: { bg: 'bg-red-500/20', color: 'text-red-300', label: '👑 Admin' },
      STAFF: { bg: 'bg-green-500/20', color: 'text-green-300', label: '🎧 Nhân viên' },
      AGENT: { bg: 'bg-blue-500/20', color: 'text-blue-300', label: '🤖 Agent' },
    };

    const config = roleConfig[role] || roleConfig.AGENT;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {staff.map((member) => {
        const online = isOnline(member.created_at);
        return (
          <div
            key={member.id}
            className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{member.full_name}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Circle size={8} className={online ? 'text-green-500 fill-green-500' : 'text-slate-500'} />
                    {online ? 'Đang online' : 'Ngoại tuyến'}
                  </div>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            <div className="mb-3">
              {getRoleBadge(member.role)}
            </div>

            {/* Joined Date */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={14} />
              Tham gia: {new Date(member.created_at).toLocaleDateString('vi-VN')}
            </div>

            {/* Action Button */}
            <button className="w-full mt-4 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-sm font-medium transition">
              Quản lý
            </button>
          </div>
        );
      })}
    </div>
  );
}
