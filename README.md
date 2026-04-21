# QuizMaster

QuizMaster là một nền tảng web tạo môi trường ôn tập trắc nghiệm tự động chấm điểm từ việc trích xuất file PDF có đáp án màu đỏ.

## Yêu cầu cài đặt
- Python 3.x
- [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/) (để chạy script parse PDF)

## Cách chạy

1. **Cài đặt thư viện (nếu cần phân tích PDF mới):**
    ```sh
    pip3 install PyMuPDF
    ```

2. **Chạy web server cục bộ:**
   Để trang web có thể đọc được file `quiz_data.json`, trình duyệt bắt buộc cần chạy trên môi trường server thay vì mở trực tiếp file.
   Chạy lệnh sau tại thư mục chứa code:
   ```sh
   python3 -m http.server 3000
   ```

3. **Mở trình duyệt:**
   Truy cập vào trang web: [http://localhost:3000](http://localhost:3000)

## Hướng dẫn sử dụng
- Nếu bạn có file PDF mới (theo đúng định dạng, câu hỏi đánh số, lựa chọn bắt đầu bằng `[a]`, đáp án đúng bôi chữ màu đỏ), bạn có thể chạy:
    ```sh
    python3 parse_quiz.py
    ```
- Nó sẽ tự động cập nhật lại file `quiz_data.json`. Tải lại trang cài đặt web và tiếp tục.

## Cấu trúc thư mục
- `index.html`: Giao diện chính của ứng dụng
- `style.css`: File thiết kế các hiệu ứng và màu sắc custom cho giao diện.
- `app.js`: Tệp Javascript chứa hoàn toàn logic hoạt động (đọc file, chia module test, lưu trữ, và chấm tự động).
- `parse_quiz.py`: Công cụ xử lý PDF sang JSON.
- `quiz_data.json`: Dữ liệu CSDL đã được trích xuất.
# Database
