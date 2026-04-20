import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../config/api';

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'STAFF' | 'AGENT';
  created_at: string;
  last_activity?: string;
}

interface EditingStaff {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'AGENT';
}

export default function StaffManagement() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [editingStaff, setEditingStaff] = useState<EditingStaff | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (userRole !== 'ADMIN') {
      navigate('/unauthorized');
      return;
    }
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchTerm, roleFilter, staff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(API_ENDPOINTS.AUTH.STAFF_LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStaff(response.data.data || []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải danh sách nhân viên';
      setError(errorMsg);
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.full_name.toLowerCase().includes(term) ||
          member.email.toLowerCase().includes(term)
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    setFilteredStaff(filtered);
  };

  const handleUpdateRole = async (staffId: string, newRole: string) => {
    try {
      setActionLoading(true);
      setActionError(null);

      await axios.put(
        API_ENDPOINTS.AUTH.UPDATE_STAFF_ROLE(staffId),
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setStaff(
        staff.map((s) =>
          s.id === staffId ? { ...s, role: newRole as any } : s
        )
      );

      setEditingStaff(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi cập nhật vai trò';
      setActionError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      setActionLoading(true);
      setActionError(null);

      await axios.delete(API_ENDPOINTS.AUTH.DELETE_STAFF(staffId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state
      setStaff(staff.filter((s) => s.id !== staffId));
      setShowDeleteConfirm(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi xóa nhân viên';
      setActionError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-500/20 text-red-300',
      STAFF: 'bg-green-500/20 text-green-300',
      AGENT: 'bg-blue-500/20 text-blue-300',
    };
    return colors[role] || colors.AGENT;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: '👑 Admin',
      STAFF: '🎧 Nhân viên',
      AGENT: '🤖 Agent',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Users size={32} className="text-blue-400" />
            <h1 className="text-3xl font-bold">Quản lý Nhân viên</h1>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Nhân viên</option>
            <option value="AGENT">Agent</option>
          </select>

          <button
            onClick={fetchStaff}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
          >
            <Plus size={20} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 m-6 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Lỗi</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <p className="text-slate-400 mt-4">Đang tải danh sách nhân viên...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">
              {staff.length === 0 ? 'Chưa có nhân viên' : 'Không tìm thấy kết quả'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg font-semibold text-sm">
              <div className="col-span-3">Tên</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Vai trò</div>
              <div className="col-span-2">Ngày tham gia</div>
              <div className="col-span-2 text-right">Hành động</div>
            </div>

            {/* Staff List */}
            {filteredStaff.map((member) => (
              <div
                key={member.id}
                className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Name */}
                  <div className="md:col-span-3">
                    <p className="text-xs text-slate-400 md:hidden mb-1">Tên</p>
                    <p className="font-semibold">{member.full_name}</p>
                  </div>

                  {/* Email */}
                  <div className="md:col-span-3">
                    <p className="text-xs text-slate-400 md:hidden mb-1">Email</p>
                    <p className="text-slate-300">{member.email}</p>
                  </div>

                  {/* Role */}
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-400 md:hidden mb-1">Vai trò</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)} inline-block`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-400 md:hidden mb-1">Ngày tham gia</p>
                    <p className="text-slate-300 text-sm">
                      {new Date(member.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingStaff(member)}
                      className="p-2 hover:bg-slate-600 rounded-lg transition text-blue-400 hover:text-blue-300"
                      title="Chỉnh sửa"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(member.id)}
                      className="p-2 hover:bg-slate-600 rounded-lg transition text-red-400 hover:text-red-300"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Cập nhật vai trò</h2>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1 hover:bg-slate-700 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-slate-300 mb-2">Nhân viên: <span className="font-semibold">{editingStaff.full_name}</span></p>
              <p className="text-slate-400 text-sm">{editingStaff.email}</p>
            </div>

            {actionError && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-sm">
                {actionError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Vai trò mới</label>
              <select
                value={editingStaff.role}
                onChange={(e) =>
                  setEditingStaff({ ...editingStaff, role: e.target.value as any })
                }
                className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="AGENT">🤖 Agent</option>
                <option value="STAFF">🎧 Nhân viên</option>
                <option value="ADMIN">👑 Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingStaff(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  handleUpdateRole(editingStaff.id, editingStaff.role)
                }
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Đang cập nhật...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-400" />
              <h2 className="text-xl font-bold">Xóa nhân viên?</h2>
            </div>

            <p className="text-slate-300 mb-4">
              Bạn chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.
            </p>

            {actionError && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-sm">
                {actionError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteStaff(showDeleteConfirm)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
