# Hiểu KAG từ số 0

> Viết cho người chưa biết gì về KAG, Docker hay OpenSPG.
> Đọc mục 1 và 2 là chạy được. Mục 3 trở đi để tra khi vấp.

1. [Hai thứ, không phải một](#1)
2. [Chạy từ đầu tới cuối](#2)
3. [Ba chỗ dễ hiểu nhầm](#3)
4. [Sáu cái bẫy](#4)
5. [Sửa KAG theo ý mình](#5)
6. [Tra nhanh](#6)

---

<a id="1"></a>
## 1. Hai thứ, không phải một

> **Docker là cái kho. KAG là người giao hàng.**

Kho chỉ biết nhận hàng và xếp lên kệ. Người giao hàng là nhân viên của bạn, đi
đường nào đóng gói sao là tùy bạn. Phải có cả hai mới chạy được.

| | KAG | OpenSPG server |
|---|---|---|
| Vai trò | người giao hàng | cái kho |
| Chạy bằng gì | Python trên máy bạn | Docker |
| Bạn clone về? | **Có** | **Không**, chỉ tải image |
| Có gọi AI không? | **Có**, bạn khai API key | **Không**, một dòng cũng không |
| Nhận gì | file `.md` của bạn | subgraph do KAG gửi tới |
| Sửa được? | thoải mái | chỉ chỉnh cấu hình bên ngoài |

Repo `OpenSPG/KAG` là thứ bạn clone. Bên trong chỉ có Python, prompt, cấu hình,
dữ liệu mẫu. **Không có Java, Neo4j, MySQL hay MinIO.** Mấy thứ đó nằm trong
image Docker của repo `openspg`, và bạn không bao giờ clone repo đó. Nó chỉ có
một công dụng: chỗ để tải file `docker-compose-west.yml` về.

Cái kho không phải một cục mà là bốn cục chạy chung: server OpenSPG ở cổng
`8887`, Neo4j ở `7687` giữ đồ thị thật, MySQL ghi lặt vặt, MinIO chứa file.
Tự cài tay bốn thứ này là việc của kỹ sư hạ tầng, mất vài ngày, và đa số lỗi
bạn gặp sẽ chẳng liên quan gì tới KAG. Docker bỏ hẳn phần đó cho bạn.

---

<a id="2"></a>
## 2. Chạy từ đầu tới cuối

### Chặng 1: dựng kho

```bash
curl -sSL https://raw.githubusercontent.com/OpenSPG/openspg/refs/heads/master/dev/release/docker-compose-west.yml -o docker-compose-west.yml
docker compose -f docker-compose-west.yml up -d
```

Mở `http://127.0.0.1:8887`, đăng nhập `openspg` / `openspg@kag`.

**Thấy giao diện là xong chặng 1.** Dừng ở đây cũng được, mai làm tiếp. Cái mốc
này quan trọng: từ giờ hễ gặp lỗi kết nối, bạn biết chắc thủ phạm không phải
server.

Giao diện sẽ trống trơn. Đúng rồi, chưa có gì để xem.

### Chặng 2: chuẩn bị dự án

Cài Python (repo khai tối thiểu 3.8, nên dùng 3.10 cho yên tâm), rồi:

```bash
git clone https://github.com/OpenSPG/KAG.git
cd KAG && pip install -e .
```

Chép `kag/examples/csqa` ra một thư mục riêng làm dự án của bạn. Sau đó làm đủ
bốn việc dưới đây, thiếu một là hỏng.

**Một, xóa sạch dữ liệu mẫu.**

```bash
rm -rf builder/data/*.md
```

Thư mục đó đang chứa hơn 7MB sách giáo trình tiếng Anh. Lệnh dựng đồ thị quét
cả thư mục, nên để nguyên là bạn trả tiền AI cho toàn bộ chỗ đó.

**Hai, điền hai API key**, không phải một. Mở `kag_config.yaml`:

- `openie_llm` và `chat_llm` là model sinh chữ, mặc định trỏ về dashscope
- `vectorize_model` là model nhúng vector, mặc định trỏ về siliconflow

Cả ba đều đang để `api_key: key`, là chỗ điền tạm. Thiếu key vector thì chết ở
bước khởi tạo dự án, dù key LLM đã đúng.

**Ba, đổi `namespace` thành tên dự án của bạn**, ví dụ `Legal`.

**Bốn, đổi luôn tên file schema cho khớp.** Đổi `schema/CsQa.schema` thành
`schema/Legal.schema`. Lệnh commit schema tìm file theo đúng tên namespace, sai
tên thì nó báo không thấy file.

### Chặng 3: nối hai bên lại

```bash
knext project restore --host_addr http://127.0.0.1:8887 --proj_path .
knext schema commit
```

Lệnh đầu đăng ký dự án lên server. Nó sẽ **tự sửa lại `kag_config.yaml` của
bạn**, ghi vào đó số hiệu dự án và địa chỉ server. Đừng hoảng khi thấy file tự
đổi. Nó cũng **thử gọi cả hai model ngay tại chỗ**, sai key là dừng luôn. Đó là
lưới an toàn, bắt lỗi trước khi bạn kịp tiêu tiền.

Lệnh sau đẩy cái khuôn schema lên server.

### Chặng 4: đổ dữ liệu

Bỏ **một** file `.md` vào `builder/data/` rồi:

```bash
cd builder && python indexer.py
```

Chạy một file trước, không chạy cả kho. Mỗi văn bản là một lần tốn tiền gọi AI.
Mở lại `http://127.0.0.1:8887`, thấy node và cạnh hiện ra là dây chuyền đã thông.
Lúc đó mới bỏ nốt phần còn lại vào.

### Chặng 5: hỏi

```bash
cd solver && python eval.py
```

Dựng đồ thị mới là nửa đầu. Nửa sau là hỏi nó. Thiếu bước này thì bạn chỉ có
một cái kho đầy hàng mà không biết lấy ra.

---

<a id="3"></a>
## 3. Ba chỗ dễ hiểu nhầm

**Giao diện ở cổng 8887 là màn hình để XEM, không phải công cụ để DỰNG.**

Nó giống cái TV. Cắm điện thì sáng, nhưng không tự phát phim. Nó xem được đồ
thị, xem và quản lý được schema, tìm kiếm được. Nó **không** có nút nạp file
`.md` vào để tự xây đồ thị. Đừng đi tìm nút import, không có đâu.

Lý do rất logic: **server không biết gì về AI.** Nó không giữ API key, không
biết gọi model nào, không có prompt. Nó không thể trích thực thể từ văn bản.
Việc đó cần AI, mà AI nằm bên KAG.

**Server không chứa KAG.** Nó chứa *kết quả* của KAG: node, cạnh, schema,
vector. Không có một dòng code KAG nào trong đó, không có logic cắt văn bản,
không có prompt, không có extractor. Nói sai chỗ này thì sau bạn sẽ đi tìm
những thứ không tồn tại.

**Sửa file trong repo KAG thì Docker không liên quan.** KAG chạy trực tiếp trên
máy bạn bằng Python. Sửa file, chạy lại lệnh, xong. Docker đứng ngoài cuộc.

Ngược lại, sửa `docker-compose-west.yml` thì phải gõ lại lệnh `docker compose
up` nó mới đọc file mới. Ngồi đợi thì không có gì xảy ra cả.

Còn thứ nằm bên trong image, tức code Java của server, Neo4j, MySQL, thì không
mở ra sửa được. Cấu hình từ ngoài thì được.

---

<a id="4"></a>
## 4. Sáu cái bẫy

### Bẫy 1: gõ `down -v` là mất sạch đồ thị

| Lệnh | Tác dụng |
|---|---|
| `docker compose stop` | tắt, giữ nguyên dữ liệu. Dùng cái này khi hết buổi. |
| `docker compose down` | xóa container, volume còn |
| `docker compose down -v` | **xóa sạch, kể cả đồ thị** |

Mất đồ thị là mất luôn số tiền AI đã tiêu để sinh ra nó.

### Bẫy 2: chạy lại là trả tiền lại từ đầu

`indexer.py` gọi hàm `invoke` đồng bộ, và dòng kiểm tra checkpoint trong hàm đó
đang bị comment ở `kag/builder/runner.py:145`. Nghĩa là mọi file đều bị xử lý
lại từ đầu, kể cả file đã xong.

Trong cùng lớp đó, bản bất đồng bộ `ainvoke` thì **có** bỏ qua, ở mức từng file
(`runner.py:254`). Còn `BuilderChainStreamRunner` bỏ qua mịn hơn, ở mức từng
đoạn văn.

Đừng vội đổi sang chúng. Bản stream cần một kiểu scanner khác, không phải scanner
quét thư mục mà bạn đang dùng, nên đó không phải chuyện sửa một dòng. Cứ biết
là chạy lại thì tốn tiền lại, và đừng xóa volume bừa.

### Bẫy 3: chạy cả kho ngay lần đầu

Đừng. Một file thôi. Cấu hình sai thì bạn vừa mất tiền vừa không biết sai ở đâu.

### Bẫy 4: dùng bản có ràng buộc schema ngay từ đầu

`schema_constraint_extractor` đọc schema **ngay lúc dựng đối tượng**, không phải
lúc chạy. Chưa commit schema thì nó gãy ngay, chưa đọc một chữ nào trong dữ liệu.
Thông báo lỗi sẽ trỏ vào chỗ khởi tạo, trông giống lỗi cấu hình model, nhưng thủ
phạm thật là chưa chạy `knext schema commit`.

Đi hai nhịp: dựng bằng `schema_free_extractor` cho thông cả dây chuyền đã, đó
cũng là mặc định của csqa. Thấy node hiện trên giao diện rồi mới đổi sang bản có
ràng buộc.

### Bẫy 5: tưởng mình cần gọi cổng 7687

`7687` là cổng nội bộ giữa server và Neo4j. Với cấu hình mặc định, code của bạn
chỉ nói chuyện với `8887`. Repo có sẵn một client nối thẳng Neo4j, nhưng cấu
hình csqa không dùng tới, nên nếu bạn thấy mình đang mở kết nối 7687 mà không cố
ý thì gần như chắc là đi nhầm đường.

Một chi tiết liên quan: server được khai cứng để gọi Neo4j **theo tên container**
`release-openspg-neo4j`, chứ không qua `localhost`. Tên đó chỉ phân giải được khi
mọi thứ nằm chung mạng Docker do file compose tạo ra. Nên tự viết lại compose mà
đổi tên container là server không tìm thấy kho và chết lúc khởi động.

### Bẫy 6: prompt đang là tiếng Anh

Cấu hình csqa để `language: en`. Dữ liệu của bạn là tiếng Việt. Bộ prompt mặc
định viết bằng tiếng Anh, nên kết quả trích xuất có thể lệch. Đây là chỗ đầu
tiên đáng chỉnh khi bạn muốn chất lượng tốt hơn.

---

<a id="5"></a>
## 5. Sửa KAG theo ý mình

Sửa thoải mái, server không hề hay biết. Vì server chỉ làm một việc duy nhất:
nhận subgraph rồi cất. Nó không quan tâm subgraph đó được tạo ra kiểu gì.

- **Prompt** là thứ bạn sẽ sửa nhiều nhất và không cần đụng logic. Xem
  `kag/builder/prompt/default/`. Ví dụ `medicine` có hẳn bộ prompt riêng trong
  `kag/examples/medicine/builder/prompt/`, copy cái đó làm khuôn.
- **Toàn bộ `kag/builder/`**: scanner, reader, splitter, extractor, vectorizer,
  writer. Muốn cắt văn bản luật theo Chương, Điều, Khoản thì viết class mới,
  đăng ký bằng decorator, khai trong `kag_config.yaml`.
- **Cách sạch hơn**: viết component trong thư mục dự án của bạn thay vì sửa
  thẳng vào `kag/`, để `git pull` bản mới không xung đột. Repo đã có sẵn cơ chế
  này, chính là hàm nạp module theo đường dẫn mà `indexer.py` đang gọi.

**Chỉ có một thứ nối hai bên lại: schema.** KAG đọc nó để biết trích cái gì,
server đọc nó để biết cho phép cất cái gì. Nên đổi luồng, đổi prompt, đổi cách
cắt thì server đứng ngoài hoàn toàn. Chỉ khi **đổi schema** mới phải gõ lại
`knext schema commit`.

> Người giao hàng đổi cách làm việc thì cái kho không hề hay biết. Chỉ khi đổi
> quy cách đóng gói mới phải báo cho kho một tiếng.

### Còn chuyện gộp KAG vào Docker

Đang học thì quên nó đi. Đó là việc của người đã chạy thông rồi và muốn đưa cho
người khác dùng. Gộp vào lúc này chỉ thêm một tầng lỗi để gỡ.

Nếu sau này cần, ba chỗ sẽ làm bạn mất thời gian: `pip install -e .` trong Docker
cần có `git` mà image Python thuần không có; `host_addr` phải đổi thành
`http://server:8887` chứ `127.0.0.1` là sai; và `depends_on` không đợi server
sẵn sàng nên cần `healthcheck`. Ngoài ra thứ tự nghiệp vụ `project restore` rồi
`schema commit` rồi `indexer.py` vẫn phải tự giữ, compose không đóng gói hộ.

---

<a id="6"></a>
## 6. Tra nhanh

### Cổng

| Cổng | Là gì | Bạn có gọi không |
|---|---|---|
| `8887` | server OpenSPG và giao diện web | **Có**, cổng duy nhất bạn dùng |
| `7687` | Neo4j | không, server tự gọi |
| `3306` | MySQL | không |
| `9000` / `9001` | MinIO | không |

### Thứ tự nhân quả

```
file .md  →  indexer.py  →  gọi AI  →  subgraph  →  gửi tới 8887  →  Neo4j
(bạn để)     (bạn gõ)      (KAG)      (KAG)        (KAG gửi)       (server cất)
```

Giao diện web đứng ngoài chuỗi này, chỉ nhìn vào kết quả ở cuối.

### Dọn dẹp

```bash
rm -rf ./builder/ckpt          # xóa checkpoint của bước dựng
docker compose stop            # tắt cụm mà giữ nguyên đồ thị
```

### Nguyên tắc gỡ lỗi

Hai lỗi trông giống hệt nhau: "không kết nối được 8887" vì server chưa bật, và
"không kết nối được 8887" vì KAG khai sai địa chỉ. Nhìn bề ngoài y chang.

Nên mới phải tách chặng 1 ra làm trước và tự tay mở trình duyệt xác nhận. Có mốc
chắc chắn rồi thì mỗi lần lỗi bạn loại được một nửa khả năng.

> **Tách biến số ra trước khi gỡ lỗi.**

---

*Dựa trên repo OpenSPG/KAG 0.8.0. Các số hiệu dòng như `runner.py:145` là để tra
thẳng trong repo khi cần.*
