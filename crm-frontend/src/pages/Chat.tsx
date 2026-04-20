import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client'; // Import thêm type Socket
import axios from 'axios';
import { Send, Bot, Headset, LogOut, Settings, Upload, ChevronLeft, MessageSquare } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import API_ENDPOINTS, { API_BASE_URL } from '../config/api';

interface AiAnalysis {
  sentiment: string;
  intent: string;
}

interface Message {
  id?: string;
  content: string;
  sender_type: 'CUSTOMER' | 'STAFF';
  ai_analysis?: AiAnalysis;
  is_image?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [senderRole, setSenderRole] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  
  // Dùng useRef để giữ kết nối socket không bị reset khi render lại
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ID của phiên chat từ database - thay đổi nếu cần test với phiên khác
  // Use URL param if provided, otherwise use default
  const CONVERSATION_ID = conversationId || "766434e8-97fd-45e4-ac30-c76e16495294";

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        setUserName(user.full_name);
        // Nếu user là STAFF, mặc định set senderRole là STAFF
        if (user.role === 'STAFF') {
          setSenderRole('STAFF');
        }
      } catch (error) {
        console.error('Lỗi parse user data:', error);
        // Redirect to login if user data is corrupted
        window.location.href = '/login';
      }
    } else {
      // No user data found, redirect to login
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // 1. Lấy Token từ LocalStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No token found, redirecting to login');
      window.location.href = '/login';
      return;
    }

    // 2. Khởi tạo Socket và nhét Token vào phần auth (Xác thực)
    socketRef.current = io(API_BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('receive_message', (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on('ai_analyzed', (data: { message_id: string, ai_data: AiAnalysis }) => {
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === data.message_id ? { ...msg, ai_analysis: data.ai_data } : msg
        )
      );
    });

    socket.on('connect_error', (err) => {
      console.error("Lỗi kết nối Socket:", err.message);
      if (err.message.includes('Authentication error') || err.message.includes('jwt')) {
        alert('Phiên đăng nhập hết hạn!');
        window.location.href = '/login';
      }
    });

    return () => {
      socket.disconnect(); // Ngắt kết nối khi chuyển trang
    };
  }, []);

  // API lấy lịch sử (Giữ nguyên)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token available for fetching chat history');
          return;
        }

        const response = await axios.get(API_ENDPOINTS.CHAT.MESSAGES(CONVERSATION_ID), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // Handle new response format with data wrapper
        const data = response.data.data || response.data;
        setMessages(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Lỗi tải lịch sử chat:", error);
        // Handle 404 gracefully if chat endpoint doesn't exist
        if (error.response?.status === 404) {
          setMessages([]);
        }
      }
    };
    fetchHistory();
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socketRef.current) return;

    const dataToSend = {
      conversation_id: CONVERSATION_ID,
      sender_type: senderRole, 
      content: inputValue,
    };

    // Dùng socketRef.current để gửi
    socketRef.current.emit('send_message', dataToSend);
    setInputValue(''); 
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ cho phép upload file ảnh (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', CONVERSATION_ID);
      formData.append('sender_type', senderRole);

      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.FILES.UPLOAD_IMAGE, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Thêm message ảnh vào chat
      const imageMessage: Message = {
        id: response.data.data.id,
        content: response.data.data.content,
        sender_type: senderRole,
        is_image: true
      };
      
      setMessages((prev) => [...prev, imageMessage]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      alert('Có lỗi khi upload ảnh. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/login');
  };

  return (
    <div className="flex justify-center items-center h-screen bg-slate-900 p-4">
      <div className="w-full max-w-2xl bg-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        <div className="bg-slate-700 p-4 flex items-center justify-between border-b border-slate-600">
          <div className="flex items-center gap-3">
            {conversationId && (
              <button
                onClick={() => navigate('/chat-list')}
                className="text-slate-300 hover:text-white transition p-1"
                title="Quay lại danh sách chat"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="bg-green-500 p-2 rounded-full">
              <Headset className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Hỗ trợ Khách hàng (Live)</h2>
              <p className="text-green-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Hệ thống đang kết nối
              </p>
            </div>
          </div>
          
          {/* Thông tin user */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-slate-200 text-sm font-medium">{userName}</p>
              <p className={`text-xs font-semibold ${userRole === 'STAFF' ? 'text-green-400' : 'text-blue-400'}`}>
                {userRole === 'STAFF' ? '👤 Nhân viên' : '👥 Khách hàng'}
              </p>
            </div>
            {!conversationId && (
              <button 
                onClick={() => navigate('/chat-list')}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors flex items-center gap-1"
                title="Danh sách Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            {userRole === 'ADMIN' && (
              <button 
                onClick={() => navigate('/admin')}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-colors flex items-center gap-1"
                title="Admin Dashboard"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors flex items-center gap-1"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          {messages.length === 0 ? (
            <p className="text-slate-400 text-center mt-10">Đang tải lịch sử trò chuyện...</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex flex-col max-w-[80%] ${msg.sender_type === 'CUSTOMER' ? 'self-end items-end' : 'self-start items-start'}`}>
                
                {/* Tên người gửi */}
                <span className="text-xs text-slate-400 mb-1 ml-1 flex items-center gap-1">
                  {msg.sender_type === 'CUSTOMER' ? 'Khách hàng' : <><Headset className="w-3 h-3"/> Nhân viên</>}
                </span>

                <div className={`p-3 rounded-2xl ${msg.sender_type === 'CUSTOMER' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none'}`}>
                  {msg.is_image ? (
                    <img 
                      src={msg.content} 
                      alt="Chat image" 
                      className="max-w-xs max-h-80 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
                      onClick={() => window.open(msg.content, '_blank')}
                    />
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.ai_analysis && msg.sender_type === 'CUSTOMER' && (
                  <div className="mt-1 flex gap-2 text-xs font-medium animate-fade-in">
                    <span className="flex items-center gap-1 bg-slate-700 text-yellow-400 px-2 py-1 rounded-md">
                      <Bot className="w-3 h-3" /> Ý định: {msg.ai_analysis.intent}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-700 text-pink-400 px-2 py-1 rounded-md">
                      Cảm xúc: {msg.ai_analysis.sentiment}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* MỚI: Thêm nút chọn vai trò ở khu vực nhập tin nhắn */}
        <div className="p-4 bg-slate-750 border-t border-slate-600 flex gap-2">
          {userRole !== 'STAFF' && (
            <select 
              value={senderRole}
              onChange={(e) => setSenderRole(e.target.value as 'CUSTOMER' | 'STAFF')}
              className="bg-slate-800 text-slate-200 border border-slate-600 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm font-medium"
            >
              <option value="CUSTOMER">🧑 Khách hàng</option>
              <option value="STAFF">🎧 Nhân viên (Demo)</option>
            </select>
          )}
          {userRole === 'STAFF' && (
            <div className="bg-slate-800 text-slate-200 border border-slate-600 rounded-lg px-3 py-3 text-sm font-medium flex items-center">
              🎧 Gửi tin nhắn dưới tên Nhân viên
            </div>
          )}

          {/* File Upload Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />

          {/* Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
            title="Upload ảnh"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={userRole === 'STAFF' ? "Trả lời khách hàng..." : "Đóng vai khách hàng hoặc nhân viên..."}
            className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSendMessage}
            className={`text-white p-3 rounded-lg transition-colors flex flex-col items-center justify-center ${senderRole === 'CUSTOMER' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}