# Bên trong KAG

Tài liệu tiếng Việt về KAG (Knowledge Augmented Generation) của OpenSPG, giải thích cơ chế
bằng một bộ dữ liệu luật an ninh mạng và AI của Việt Nam thay vì ví dụ y khoa gốc trong repo.

## Nội dung

| File | Là gì |
|---|---|
| `ben-trong-kag.html` | Trang chính. Chín mục, chín sơ đồ, đi từ câu hỏi thử tới file cần sửa. Mở thẳng bằng trình duyệt, có nút chuyển nền sáng tối. |
| `KAG-giai-thich.md` | Bản tóm tắt ngắn, đọc trong khoảng 30 phút. |
| `sd1-rag-graphrag-kag.html` | Sơ đồ so sánh RAG, GraphRAG và KAG. |
| `sd2-kien-truc.html` | Sơ đồ kiến trúc tổng thể. |
| `sd3-luong-end-to-end.html` | Sơ đồ luồng từ đầu tới cuối. |
| `sd*.json` | Mô tả nguồn của ba sơ đồ trên. |

Mọi file HTML đều tự chứa, không cần build, không gọi mạng ngoài trừ font Google.

## Nguồn

- Mã: [OpenSPG/KAG](https://github.com/OpenSPG/KAG) bản 0.8.0
- Dữ liệu luật: bộ `kag-legal-data`, 46 văn bản đã làm sạch, khoảng 4,19 triệu chữ

Trang chính ghi rõ nguồn từng khối bằng bốn nhãn: *từ repo*, *từ bộ dữ liệu*,
*viết cho dự án này*, *minh họa*. Chỗ nào chưa kiểm chứng được thì ghi *chưa xác minh*.
