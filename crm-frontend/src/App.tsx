import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import AdminDashboard from './pages/AdminDashboard';
import StaffManagement from './pages/StaffManagement';
import AIConfiguration from './pages/AIConfiguration';
import type { ReactNode } from 'react';

// Component kiểm tra quyền: Có Token mới cho vào, không thì đuổi ra trang Login
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Component kiểm tra quyền ADMIN
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đường dẫn mở: Ai cũng vào được để đăng nhập/đăng ký */}
        <Route path="/login" element={<Auth />} />

        {/* Trang lỗi quyền */}
        <Route path="/unauthorized" element={
          <div className="flex items-center justify-center h-screen bg-slate-900">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-400 mb-4">❌ 403 - Truy cập bị từ chối</h1>
              <p className="text-slate-400 mb-6">Bạn không có quyền truy cập trang này</p>
              <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
                Quay lại Chat
              </a>
            </div>
          </div>
        } />

        {/* Admin Dashboard */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />

        {/* Staff Management Page */}
        <Route 
          path="/admin/staff" 
          element={
            <AdminRoute>
              <StaffManagement />
            </AdminRoute>
          } 
        />

        {/* AI Configuration Page */}
        <Route 
          path="/admin/ai-config" 
          element={
            <AdminRoute>
              <AIConfiguration />
            </AdminRoute>
          } 
        />

        {/* Chat List Page */}
        <Route 
          path="/chat-list" 
          element={
            <ProtectedRoute>
              <ChatList />
            </ProtectedRoute>
          } 
        />

        {/* Chat Page - Individual Conversation */}
        <Route 
          path="/chat/:conversationId" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />

        {/* Chat Page - Default */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;