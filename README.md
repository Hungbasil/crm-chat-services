# SYSTEM CONTEXT FOR AI ASSISTANT

**Project Name:** Omni-Channel CRM Chat with Gemini AI
**Developer:** Hưng (Student at NTTU)
**Goal:** Xây dựng hệ thống CRM quản lý tin nhắn thời gian thực, phân quyền role-based, tích hợp AI để phân tích cảm xúc khách hàng.

## 1. TECH STACK
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL (kết nối qua `pg` pool)
- **Real-time:** Socket.io
- **AI Integration:** `@google/generative-ai` (Gemini 1.5/2.0 Flash)
- **Authentication:** JWT (JSON Web Token), Argon2 (Password Hashing)
- **Frontend:** React.js (Vite), TypeScript, Tailwind CSS v3, React Router DOM, Recharts (vẽ biểu đồ), Lucide React (Icons).
- **Package Manager:** npm

## 2. DATABASE SCHEMA (PostgreSQL)
Hệ thống hiện tại có các bảng chính sau:

- **`users`** (Tài khoản nhân viên/admin): 
  - `id` (UUID, PK)
  - `email` (VARCHAR 255, Unique)
  - `password_hash` (VARCHAR 255)
  - `full_name` (VARCHAR 100)
  - `role` (VARCHAR 50) - Giá trị: 'ADMIN' hoặc 'STAFF'
  - `created_at` (TIMESTAMP)

- **`conversations`** (Phiên chat):
  - `id` (UUID, PK)
  - `status` (VARCHAR 50)
  - `created_at` (TIMESTAMP)

- **`messages`** (Chi tiết tin nhắn):
  - `id` (UUID, PK)
  - `conversation_id` (UUID, FK -> conversations.id)
  - `sender_type` (VARCHAR 50) - Giá trị: 'CUSTOMER' hoặc 'STAFF'
  - `content` (TEXT)
  - `ai_analysis` (JSONB) - Lưu kết quả AI. Format: `{"intent": "...", "sentiment": "..."}`
  - `created_at` (TIMESTAMP)

## 3. PROJECT STRUCTURE & ROUTING

### Backend (`/backend`)
- `src/index.ts`: Entry point, setup Express, Socket.io middleware (kiểm tra JWT), kết nối DB.
- `src/config/db.ts`: Cấu hình PostgreSQL (`pool`).
- `src/Controllers/auth.ts`: Xử lý Login/Register, gen JWT chứa `{ id, role }`.
- `src/Routes/auth.ts`: Định tuyến API `/api/auth/login` và `/api/auth/register`.
- `src/Middleware/authorize.ts` (Dự kiến): Middleware checkRole('ADMIN', 'STAFF').

### Frontend (`/frontend`)
- `src/App.tsx`: Chứa React Router. Các routes: `/login` (Public), `/` (Protected - Chat), `/admin` (Protected - AdminRoute).
- `src/pages/Auth.tsx`: Giao diện Login/Register.
- `src/pages/Chat.tsx`: Khung chat real-time. Role người gửi lấy từ State (giả lập) hoặc JWT.
- `src/pages/AdminDashboard.tsx`: Dashboard thống kê (hiện đang dùng Fake Data).
- **Bảo mật:** Token lưu ở `localStorage.getItem('token')`. Dữ liệu user lưu ở `localStorage.getItem('user')`.

## 4. REAL-TIME FLOW (SOCKET.IO)
- **Middleware:** Socket yêu cầu gửi JWT trong `auth: { token }` khi connect. Nếu sai/thiếu -> ngắt kết nối.
- **Events (Client -> Server):** - `send_message`: Nhận `{ conversation_id, sender_type, content }`.
- **Events (Server -> Client):**
  - `receive_message`: Trả về message object đã lưu DB.
  - `ai_analyzed`: Trả về `{ message_id, conversation_id, ai_data }` sau khi Gemini phân tích xong (chạy bất đồng bộ, chỉ kích hoạt khi `sender_type === 'CUSTOMER'`).

## 5. CURRENT PROGRESS (Hoàn thành đến ngày 18/04/2026)
1. ✅ Đã xong setup MERN stack + PostgreSQL.
2. ✅ Đã xong luồng Đăng ký / Đăng nhập và phân quyền Route (Admin/Staff/Public).
3. ✅ Đã làm xong UI Chat Real-time, kết nối thành công với Socket.io và DB.
4. ✅ Đã tích hợp thành công Gemini AI để cập nhật JSONB vào cột `ai_analysis`.
5. ✅ Đã dựng xong UI AdminDashboard bằng Recharts với DỮ LIỆU THẬT từ DATABASE.
6. ✅ **NEW:** Viết API `/api/dashboard/stats` để lấy dữ liệu thực từ PostgreSQL (sentiment analysis, message trends, staff list, etc.).
7. ✅ **NEW:** AdminDashboard fetch dữ liệu từ API thay vì dùng fake data. Hiển thị loading state và error handling.
8. ✅ **NEW:** Tính năng upload file ảnh trong chat - người dùng có thể upload JPEG, PNG, GIF, WebP (max 5MB).

## 6. IMPLEMENTATION DETAILS (NEW - 18/04/2026)

### Dashboard API Endpoints
- **GET `/api/dashboard/stats`** - Lấy tất cả thống kê (Admin only)
  - totalMessages: Số lượng tin nhắn tổng cộng
  - sentimentAnalysis: Phân tích cảm xúc từ `ai_analysis` JSONB
  - recentConversations: 5 cuộc chat mới nhất với customer info
  - messageTrend: Thống kê tin nhắn theo ngày (7 ngày gần đây)
  - staffList: Danh sách nhân viên và admin

- **GET `/api/dashboard/sentiment`** - Chi tiết sentiment + intent analysis
- **GET `/api/dashboard/channel-stats`** - Thống kê theo channel (Facebook, WhatsApp, etc.)

### Image Upload Feature
- **POST `/api/files/upload-image`** - Upload ảnh vào chat
  - Hỗ trợ: JPEG, PNG, GIF, WebP
  - Giới hạn: 5MB
  - Lưu: Disk storage tại `/uploads/` với tên file unique
  - Hiển thị: Click ảnh để mở full-size

### Frontend Components
- AdminDashboard: Fetch real data, loading state, error retry
- Chat.tsx: File upload button, image preview, validation
- Sentiment/Message charts: Display real data từ API

### Backend File Structure (NEW)
- `src/Middleware/upload.ts` - Multer configuration
- `src/Controllers/fileUpload.ts` - Image upload handler
- `src/Routes/upload.ts` - Upload endpoint
- `uploads/` - Directory for uploaded images

## 7. NEXT STEPS (Optional Enhancements)
Những improvement có thể thêm sau:
1. Tối ưu hóa ảnh upload (resize, compress, convert to WebP).
2. Thêm preview ảnh trước khi upload.
3. Auto-cleanup uploaded files (cron job).
4. Add file attachment types (PDF, DOC, etc.).
5. Implement image search/gallery view.
6. Add watermark to uploaded images.
7. Cải thiện dashboard với filter, export features.
8. Real-time dashboard updates using WebSocket.

## 8. AI ASSISTANT RULES
- Khi viết code mới, LUÔN giữ nguyên kiến trúc hiện tại, không tự ý đổi thư viện nếu không được yêu cầu.
- Đảm bảo strict type checking với TypeScript.
- Nếu cần viết API liên quan đến `ai_analysis`, nhớ xử lý JSONB cẩn thận trong PostgreSQL.
- Maintain backward compatibility khi cập nhật existing code.
- Test tất cả các API endpoints trước khi merge.

## 9. DOCUMENTATION
- **QUICK_START.md** - Hướng dẫn setup & chạy project
- **IMPLEMENTATION_SUMMARY.md** - Chi tiết từng feature được implement