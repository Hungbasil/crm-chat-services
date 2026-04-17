import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client'; // Import thêm type Socket
import axios from 'axios';
import { Send, Bot, Headset, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AiAnalysis {
  sentiment: string;
  intent: string;
}

interface Message {
  id?: string;
  content: string;
  sender_type: 'CUSTOMER' | 'STAFF';
  ai_analysis?: AiAnalysis;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [senderRole, setSenderRole] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const navigate = useNavigate();
  
  // Dùng useRef để giữ kết nối socket không bị reset khi render lại
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ID của phiên chat từ database - thay đổi nếu cần test với phiên khác
  const CONVERSATION_ID = "766434e8-97fd-45e4-ac30-c76e16495294";

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
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
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // 1. Lấy Token từ LocalStorage
    const token = localStorage.getItem('token');

    // 2. Khởi tạo Socket và nhét Token vào phần auth (Xác thực)
    socketRef.current = io('http://localhost:3000', {
      auth: { token }
    });

    const socket = socketRef.current;

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
      if (err.message.includes('Authentication error')) {
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
        const response = await axios.get(`http://localhost:3000/api/chat/${CONVERSATION_ID}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMessages(response.data);
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
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
                  {msg.content}
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