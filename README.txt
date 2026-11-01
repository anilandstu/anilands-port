ANILANDS — GitHub Pages + Google Apps Script

CẤU TRÚC
- index.html: đăng nhập / đăng ký
- home.html: trang Artist
- admin.html: trang quản trị
- css/style.css: giao diện
- js/config.js: URL Apps Script
- js/*.js: logic giao diện
- Code.gs: backend Apps Script

QUAN TRỌNG
1. Giữ nguyên Google Sheet hiện tại với cột A:I:
   A id | B username | C email | D password | E coin | F role | G created_at | H status | I facebook
2. Mở Apps Script đang dùng, thay Code.gs bằng Code.gs trong thư mục này.
3. Giữ Script Properties:
   ANILANDS_SPREADSHEET_ID = ID Google Sheet hiện tại
   ANILANDS_SHARED_SECRET = secret dài, riêng tư (không đưa lên GitHub)
4. Admin được tự khởi tạo ở lần gọi API đầu tiên nếu chưa có tài khoản admin:
   username: admin
   password: tri12345
   Không cần chạy hàm initializeAdmin() thủ công.
5. Deploy > Manage deployments > Edit > New version > Deploy.
   Execute as: Me
   Who has access: Anyone
6. Sao chép URL Web App kết thúc bằng /exec.
7. Mở js/config.js, thay DAN_URL_GOOGLE_APPS_SCRIPT_WEB_APP_CUA_BAN_VAO_DAY bằng URL /exec.
8. Tải toàn bộ nội dung thư mục lên repository GitHub, bật Settings > Pages > Deploy from a branch > main / root.
9. Mở trang GitHub Pages.

GHI CHÚ BẢO MẬT
- Không đưa ANILANDS_SHARED_SECRET vào bất kỳ file GitHub nào.
- Mật khẩu Artist được hash ở Apps Script và lưu ở cột D.
- Hash mật khẩu cũ dạng bcrypt từ PHP không được hỗ trợ bởi phiên bản này; bản triển khai mới dành cho tài khoản mới. Không xóa dữ liệu cũ nếu chưa sao lưu.
- API dùng token ký HMAC, hết hạn sau 8 giờ.
- Mật khẩu admin mặc định được tạo tự động lần đầu; thay đổi mật khẩu mặc định trước khi đưa website vào sử dụng thật.
- GitHub Pages là website tĩnh; Google Apps Script là backend.
