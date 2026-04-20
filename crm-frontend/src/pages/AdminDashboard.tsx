import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  BarChart3,
  TrendingUp,
  Activity,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import StatCard from '../components/StatCard';
import ChatTable from '../components/ChatTable';
import StaffList from '../components/StaffList';
import SentimentChart from '../components/SentimentChart';
import MessageTrendChart from '../components/MessageTrendChart';

interface DashboardStats {
  totalMessages: number;
  sentimentAnalysis: {
    sentiment: string;
    count: number;
  }[];
  recentConversations: {
    id: string;
    customer_name: string;
    channel: string;
    latest_message: string;
    latest_sentiment: string;
    created_at: string;
  }[];
  messageTrend: {
    date: string;
    count: number;
  }[];
  staffList: {
    id: string;
    full_name: string;
    role: string;
    created_at: string;
  }[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'ADMIN') {
      navigate('/unauthorized');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.DASHBOARD.STATS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API returns wrapped response: { success, code, message, data: {...stats}, timestamp }
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải dashboard:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', href: '/admin' },
    { icon: MessageSquare, label: 'Danh sách Chat', href: '/chat-list' },
    { icon: Users, label: 'Quản lý Nhân viên', href: '/admin/staff' },
    { icon: Settings, label: 'Cấu hình AI', href: '/admin/ai-config' },
  ];

  const satisfactionRate = dashboardData?.sentimentAnalysis
    ? Math.round(
        (dashboardData.sentimentAnalysis.find(s => s.sentiment === 'hài lòng')?.count || 0) /
        dashboardData.sentimentAnalysis.reduce((sum, s) => sum + s.count, 1) * 100
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <p>Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <p className="font-semibold mb-2">⚠️ Lỗi</p>
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-xl">CRM Chat</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.href)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition group cursor-pointer text-left"
            >
              <item.icon size={20} className="text-blue-400 group-hover:text-blue-300" />
              {sidebarOpen && (
                <span className="group-hover:text-blue-300 transition">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <h2 className="text-2xl font-bold">📊 Admin Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Quản lý và giám sát hệ thống CRM Chat</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={MessageSquare}
              label="Tổng tin nhắn"
              value={dashboardData?.totalMessages || 0}
              trend="+12%"
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Tỷ lệ hài lòng"
              value={`${satisfactionRate}%`}
              trend="+5%"
              color="green"
            />
            <StatCard
              icon={UserCheck}
              label="Nhân viên online"
              value={dashboardData?.staffList.length || 0}
              trend={`Trong ${dashboardData?.staffList.length || 0} nhân viên`}
              color="purple"
            />
            <StatCard
              icon={Activity}
              label="Cuộc chat hoạt động"
              value={dashboardData?.recentConversations.length || 0}
              trend="Hôm nay"
              color="orange"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Analysis */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" />
                Phân tích Cảm xúc
              </h3>
              {dashboardData?.sentimentAnalysis && dashboardData.sentimentAnalysis.length > 0 ? (
                <SentimentChart data={dashboardData.sentimentAnalysis} />
              ) : (
                <p className="text-slate-400 text-center py-8">Chưa có dữ liệu</p>
              )}
            </div>

            {/* Message Trend */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-400" />
                Lưu lượng tin nhắn (7 ngày)
              </h3>
              {dashboardData?.messageTrend && dashboardData.messageTrend.length > 0 ? (
                <MessageTrendChart data={dashboardData.messageTrend} />
              ) : (
                <p className="text-slate-400 text-center py-8">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          {/* Recent Conversations Table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-400" />
              5 Cuộc chat mới nhất
            </h3>
            {dashboardData?.recentConversations && dashboardData.recentConversations.length > 0 ? (
              <ChatTable conversations={dashboardData.recentConversations} />
            ) : (
              <p className="text-slate-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>

          {/* Staff List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Users size={20} className="text-purple-400" />
              Danh sách Nhân viên
            </h3>
            {dashboardData?.staffList && dashboardData.staffList.length > 0 ? (
              <StaffList staff={dashboardData.staffList} />
            ) : (
              <p className="text-slate-400 text-center py-8">Chưa có nhân viên</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
