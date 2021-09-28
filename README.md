# hssk_check_info


**Tool hỗ trợ kiểm tra dữ liệu sai trên cổng TC**

- Hỗ trợ đầu vào file csv (đang phát triển)
- Hỗ trợ kiểm tra và so khớp các trường thông tin, có cảnh báo các dữ liệu đang sai khác
- Hỗ trợ xuất dữ liệu kết quả kiểm tra ra file csv

**Tool hỗ trợ sửa dữ liệu sai trên cổng TC**

- Hỗ trợ sửa các dữ liệu sai như: 
	+ Họ tên
	+ Ngày sinh
	+ Giới tính
	+ SĐT
- Cảnh báo ngày sinh ( <17 tuổi)
- Cảnh báo giới tính
- Xuất kết quả ra file csv (kèm dữ liệu cũ nếu có sửa đổi)

## Lưu ý để chạy được::
-  Tìm đoạn #YOUR_ACCOUTNT và #YOUR_PASSWORD rồi điền tài khoản của bạn vào để chạy !
-  Chuẩn hoá dữ liệu và đưa vào biến data dạng sau
	+ Tên;Ngày sinh;Giới tính;SĐT;CMND;Số Mũi Tiêm
	+ Các dòng phân cách bởi ký tự \n
- VD 2 dòng dữ liệu: data = "Nguyễn Thị A;15/09/2021;Nữ;0987654321;123456789;1\nBÙI QUANG D;31/11/1986;Nam;0987654321;123456789123;1"
- Phần dữ liệu chuẩn thì so khớp mới chính xác