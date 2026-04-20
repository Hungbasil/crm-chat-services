import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import API_ENDPOINTS from '../config/api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? API_ENDPOINTS.AUTH.LOGIN : API_ENDPOINTS.AUTH.REGISTER;
      const payload = isLogin ? { email, password } : { email, password, full_name: fullName };

      const response = await axios.post(endpoint, payload);

      if (isLogin) {
        // Đăng nhập thành công -> Lưu Token vào LocalStorage và chuyển hướng vào Chat
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('userRole', response.data.data.user.role);
        navigate('/'); 
      } else {
        // Đăng ký thành công -> Báo thành công và chuyển sang form đăng nhập
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
      }
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error?.message ||
        'Có lỗi xảy ra, vui lòng thử lại!';
      setError(errorMessage);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          {isLogin ? 'Đăng Nhập CRM' : 'Tạo Tài Khoản'}
        </h2>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-500/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" required placeholder="Họ và tên"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="email" required placeholder="Email đăng nhập"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="password" required placeholder="Mật khẩu"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors mt-4">
            {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
          </button>
        </form>

        <p className="text-slate-400 text-center mt-6">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-400 hover:underline font-medium">
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  );
}