# KAG hoạt động thế nào

Tài liệu tiếng Việt về KAG (Knowledge Augmented Generation) của OpenSPG, giải thích cơ chế
bằng một bộ dữ liệu luật an ninh mạng và AI của Việt Nam thay vì ví dụ y khoa gốc trong repo.

Trang đọc: <https://human6004.github.io/ben-trong-kag/>

## Cấu trúc

```
index.html              trang chính, chín mục và chín sơ đồ
assets/css/
  tokens.css            biến màu, biến font, ba trạng thái sáng/tối
  base.css              reset, thân trang, alias font
  layout.css            rail, main, hero, tiêu đề mục, chân trang, mobile
  components.css        callout, khối mã, bảng, tab, chip, stepper, thẻ, từ điển
  diagram.css           lớp dùng chung cho sơ đồ SVG
assets/js/app.js        đổi nền sáng/tối, tab, stepper, tô sáng mục lục
diagrams/               ba sơ đồ rời, mỗi cái một file tự chứa, kèm .json mô tả nguồn
docs/KAG-giai-thich.md  bản tóm tắt ngắn, đọc trong khoảng 30 phút
```

Chín sơ đồ trong `index.html` là SVG nội tuyến, không tách ra file `.svg` được vì chúng
lấy màu từ biến CSS của trang để đổi theo nền sáng tối. Ảnh nhúng bằng thẻ `img` không
kế thừa biến đó.

Không có bước build. Mở `index.html` bằng trình duyệt là chạy. Mạng chỉ dùng để tải font
Google, tắt mạng thì rơi về font hệ thống.

## Thứ tự nạp CSS

Năm file phải giữ đúng thứ tự trong `index.html`. Khối `@media (max-width:900px)` nằm
cuối `layout.css` sửa `.shell`, `.rail`, `.toc`, `.wrap`, `.hero` và `footer`, nên các
khai báo gốc của những selector đó phải nằm cùng file và đứng trước nó.

## Nguồn

- Mã: [OpenSPG/KAG](https://github.com/OpenSPG/KAG) bản 0.8.0
- Dữ liệu luật: bộ `kag-legal-data`, 46 văn bản đã làm sạch, khoảng 4,19 triệu chữ

Trang chính ghi rõ nguồn từng khối bằng bốn nhãn: *từ repo*, *từ bộ dữ liệu*,
*viết cho dự án này*, *minh họa*. Chỗ nào chưa kiểm chứng được thì ghi *chưa xác minh*.
