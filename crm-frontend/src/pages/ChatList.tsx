import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Search, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatTable from '../components/ChatTable';
import API_ENDPOINTS from '../config/api';

interface ChatItem {
  id: string;
  customer_id: string;
  customer_name: string;
  channel: string;
  status: string;
  latest_message: string;
  latest_sentiment: string;
  created_at: string;
  updated_at: string;
  total_messages: number;
}

interface ChatListData {
  data: ChatItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResponse {
  success: boolean;
  code: number;
  message: string;
  data: ChatListData;
  timestamp: string;
}

export default function ChatList() {
  const [conversations, setConversations] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch chat list from API
  const fetchChatList = async (pageNum: number, lim: number, filterStatus?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params: any = {
        page: pageNum,
        limit: lim,
      };

      if (filterStatus) {
        params.status = filterStatus;
      }

      const response = await axios.get<PaginatedResponse>(
        API_ENDPOINTS.CHAT.LIST,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Response format: { success, code, message, data: { data, total, page, limit, totalPages }, timestamp }
      const paginatedData = response.data.data;
      
      if (!paginatedData) {
        console.error('No data in response');
        setConversations([]);
        return;
      }

      const conversationsData = Array.isArray(paginatedData.data) ? paginatedData.data : [];
      setConversations(conversationsData);
      setTotal(paginatedData.total || 0);
      setPage(paginatedData.page || pageNum);
      setLimit(paginatedData.limit || lim);
      setTotalPages(paginatedData.totalPages || 0);
    } catch (error: any) {
      console.error('Error fetching chat list:', error);
      console.error('Full error response:', error.response?.data);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load chat list on component mount and when page/status changes
  useEffect(() => {
    fetchChatList(page, limit, status);
  }, [page, limit, status]);

  // Handle pagination
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // Handle conversation click to view chat
  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  // Filter conversations based on search query
  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter((conv) => {
        const customerName = (conv.customer_name || '').toLowerCase();
        const latestMessage = (conv.latest_message || '').toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        return customerName.includes(searchLower) || latestMessage.includes(searchLower);
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Danh sách Chat</h1>
        <p className="text-slate-400">Quản lý và xem tất cả các cuộc trò chuyện</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex gap-4 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng hoặc tin nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-400"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1); // Reset to first page when filter changes
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="CLOSED">Đã đóng</option>
          <option value="PENDING">Chờ xử lý</option>
        </select>

        {/* Limit Selector */}
        <select
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1); // Reset to first page when limit changes
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
        >
          <option value={5}>5 trên trang</option>
          <option value={10}>10 trên trang</option>
          <option value={20}>20 trên trang</option>
          <option value={50}>50 trên trang</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-blue-400" size={32} />
        </div>
      ) : (
        <>
          {/* Chat Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-6">
            {filteredConversations.length > 0 ? (
              <div
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  const target = e.target as HTMLElement;
                  const row = target.closest('tr') as HTMLTableRowElement;
                  if (row) {
                    const conversationId = row.getAttribute('data-conversation-id');
                    if (conversationId) {
                      handleConversationClick(conversationId);
                    }
                  }
                }}
              >
                <ChatTable conversations={filteredConversations} />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p>Không có cuộc trò chuyện nào</p>
              </div>
            )}
          </div>

          {/* Update ChatTable to include data-conversation-id attribute */}
          {/* Pagination Info */}
          <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400">
              Trang {page} / {totalPages} | Tổng: {total} cuộc trò chuyện
            </div>

            {/* Pagination Controls */}
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                <ChevronLeft size={18} />
                Trước
              </button>

              <div className="flex items-center gap-2 px-4">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded transition ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                Sau
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
