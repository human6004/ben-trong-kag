# KAG — Knowledge Augmented Generation

> Bài giải thích ngắn để hiểu KAG trong ~30 phút, đủ để giảng lại và biết đường áp dụng.
> Repo: https://github.com/OpenSPG/KAG.git — ví dụ chạy xuyên suốt: `kag/examples/medicine/`
>
> Kèm 3 sơ đồ HTML trong cùng thư mục (mở bằng trình duyệt, có nút dark/light và export PNG/SVG):
> - `diagrams/sd1-rag-graphrag-kag.html`
> - `diagrams/sd2-kien-truc.html`
> - `diagrams/sd3-luong-end-to-end.html`
>
> File `.json` cùng tên là source của sơ đồ, sửa rồi render lại bằng skill archify.

---

## 1. KAG là gì

**Vấn đề của RAG thường.** RAG cắt tài liệu thành chunk, nhúng thành vector, truy hồi bằng độ giống nhau, một lượt. Giống như tìm sách bằng cách đọc lướt xem trang nào "nghe giống" câu hỏi. Nó không nối được hai mẩu thông tin nằm ở hai trang khác nhau.

Câu hỏi ví dụ mà RAG thường trả sai, lấy đúng dữ liệu trong `kag/examples/medicine/`:

> "Bệnh có triệu chứng hồi hộp lo âu thì uống thuốc gì?"

Trong dữ liệu, `SPO.csv` có dòng `Panic_disorder,has_symptom,Anxiety_and_nervousness`, còn thuốc điều trị lại nằm trong đoạn mô tả bệnh ở `Disease.csv`. Không đoạn văn nào chứa cả triệu chứng lẫn tên thuốc. RAG lấy top-k theo vector sẽ ra toàn đoạn nói về "lo âu", không bao giờ chạm tới tên thuốc.

**Vấn đề của GraphRAG.** GraphRAG có đồ thị, nhưng đồ thị được trích tự do bằng OpenIE (Open Information Extraction — trích triple (bộ ba) không ràng buộc kiểu). Cùng một loại thuốc xuất hiện dưới ba tên khác nhau thành ba node. Giống như ba người cùng ghi sổ mà không thống nhất cách viết tên.

**KAG sửa bằng 3 ý chính.**

1. **Chỉ mục hai chiều knowledge–chunk.** Đồ thị và văn bản gốc trỏ ngược lẫn nhau, không phải hai kho riêng.
2. **Trích theo schema.** Chuyên gia y khoa khai báo trước `Disease`, `Symptom`, `Medicine` và các quan hệ, LLM phải trích vào đúng khuôn đó.
3. **Suy luận theo logical form.** Câu hỏi được dịch thành kế hoạch nhiều bước có cú pháp, rồi mới đi truy hồi từng bước.

| | Cách index | Cách truy hồi | Mạnh | Yếu |
|---|---|---|---|---|
| **RAG** | Chunk + vector | Top-k cosine, 1 lượt | Rẻ, dựng trong 1 giờ | Chết ở câu hỏi bắc cầu, so sánh, đếm |
| **GraphRAG** | Đồ thị OpenIE tự do | Duyệt cụm, tóm tắt cụm | Trả lời được câu hỏi tổng quan | Nhiễu tên thực thể, khó lần về nguồn |
| **KAG** | Đồ thị theo schema + chunk, trỏ ngược nhau | Logical form nhiều bước, lai đồ thị và vector | Đa bước, có nguồn trích, hợp domain hẹp | Build đắt, cần schema, cần Docker |

### [SĐ-1] `diagrams/sd1-rag-graphrag-kag.html`

**Cách đọc:**
- Ba hàng ngang là ba cách làm, đọc trái sang phải.
- Cột 1 là cách dựng chỉ mục, cột 2 là cách truy hồi, cột 3 là thứ LLM thực sự nhận được, cột 4 là hệ quả.
- Hàng KAG được tô đậm.
- Điểm khác biệt nằm ở cột 1 và cột 2: KAG là hàng duy nhất mà chỉ mục có ràng buộc kiểu và truy hồi có nhiều bước.

---

## 2. Khái niệm cốt lõi

**Knowledge–chunk mutual index** (chỉ mục hai chiều tri thức–đoạn văn) — mỗi thực thể trong đồ thị giữ một cạnh `source` trỏ về đúng đoạn văn đã sinh ra nó, và đoạn văn cũng là một node trong đồ thị. Giống mục lục sách có số trang, mà lật tới trang đó lại thấy ghi "xem thêm mục X".
→ `kag/builder/component/extractor/schema_free_extractor.py`, hàm `assemble_sub_graph_with_chunk`

**Schema-constraint vs schema-free extraction** — schema-free trích thoải mái, cái gì không khớp schema thì gán nhãn `Others`; schema-constraint bám vào các property đã khai báo và bung chúng thành node/cạnh lồng nhau. Giống điền đơn giấy trắng so với điền form có sẵn ô.
→ `kag/builder/component/extractor/schema_free_extractor.py`
→ `kag/builder/component/extractor/schema_constraint_extractor.py`

**Semantic alignment** (gióng hàng ngữ nghĩa) — gộp các node chỉ cùng một thứ nhưng viết khác nhau, và gắn thực thể vào khái niệm cha. Giống thủ thư dồn "Nguyễn Du", "N. Du", "Nguyen Du" về một thẻ. Thực tế trong repo việc này chia đôi:
→ `kag/builder/component/aligner/kag_aligner.py` gộp subgraph trùng
→ `kag/builder/component/postprocessor/kag_postprocessor.py` linking theo độ tương đồng

**Logical form** (dạng logic) — ngôn ngữ nhỏ để viết kế hoạch trả lời, gồm các toán tử `Retrieval(...)`, `Math(...)`, `Deduce(...)`, `output(...)`. Giống công thức nấu ăn ghi từng bước thay vì bảo "làm món này đi".
→ `kag/common/parser/logic_node_parser.py` (các class node)
→ `kag/solver/prompt/logic_form_plan.py` (prompt few-shot)

**Planner / executor** (người lập kế hoạch / người thực thi) — planner đọc câu hỏi rồi sinh ra danh sách `Task` có phụ thuộc lẫn nhau; executor là các công nhân thực thi từng Task. Giống bếp trưởng chia phiếu order, còn đầu bếp từng trạm nấu.
→ `kag/solver/planner/lf_kag_static_planner.py`
→ `kag/solver/executor/`

### [SĐ-2] `diagrams/sd2-kien-truc.html`

**Cách đọc:**
- Người dùng ở trên cùng, câu hỏi đi thẳng xuống `kag/solver`.
- Khung nét đứt bên trái là KAG chạy bằng Python trên máy bạn, gồm `kag/solver` và `kag/builder`.
- Ô LLM nằm ngoài cùng bên trái, hai đường nét đứt tách ra là hai chỗ tốn tiền: gọi khi hỏi và gọi khi build.
- `knext/` ở giữa là ranh giới duy nhất giữa hai bên, nó là client REST sinh từ OpenAPI cộng thêm CLI.
- Khung nét đứt bên phải là OpenSPG engine chạy trong Docker, giữ schema, đồ thị và vector. KAG không bao giờ nói chuyện trực tiếp với graph database.

Một điểm cần nói rõ: **repo KAG này không chứa file docker-compose**. `README.md` bảo tải nó từ repo riêng `OpenSPG/openspg`. Nên danh sách service cụ thể của engine là **chưa xác minh** từ repo hiện tại.

---

## 3. Luồng hoạt động

### [SĐ-3] `diagrams/sd3-luong-end-to-end.html`

**Cách đọc:**
- Hai làn trên là nửa BUILD, làn dưới là nửa SOLVE.
- Ô nào có tag `LLM` là có gọi mô hình chat, ô `embed` chỉ gọi model embedding.
- Mũi tên vòng chạy trong khe giữa hai làn: từ `splitter` về `extractor` là chỗ mỗi chunk được xử lý song song một luồng.
- Mũi tên nét đứt từ `writer` về `question` nghĩa là hai nửa tách rời nhau về thời gian, build xong mới hỏi được.
- Thẻ chú thích dưới cùng liệt kê rõ bước nào không gọi LLM.

### Trace câu hỏi thật

Câu hỏi hardcode trong `kag/examples/medicine/solver/evaForMedicine.py` (dòng 34):
**"甲状腺结节可以吃什么药？"** — Nhân tuyến giáp thì uống thuốc gì?

**Nửa BUILD**, chạy bằng `python builder/indexer.py`:

| Bước | Component | Input → Output |
|---|---|---|
| 1 | `csv_scanner` | `Disease.csv` → từng dòng `{idx, title, text, alias}` |
| 2 | `dict_reader` | dòng CSV → `Chunk(id, name=title, content=text)` |
| 3 | `length_splitter` | chunk dài → chunk con; ở đây `split_length: 100000` nên gần như giữ nguyên |
| 4 | `schema_free_extractor` | chunk → **3 lần gọi LLM** (ner → std → triple) → `SubGraph` có `Disease[甲状腺结节]`, `Medicine[...]`, cạnh `applicableMedicine`, cộng cạnh `source` từ mỗi thực thể về node Chunk |
| 5 | `kag_post_processor` | subgraph thô → gộp node trùng, link thực thể theo độ tương đồng vector |
| 6 | `batch_vectorizer` | subgraph → nhúng embedding thẳng vào property của node, không có kho vector riêng |
| 7 | `kg_writer` | subgraph → gọi `write_graph` qua knext → OpenSPG lưu đồ thị và vector trong **một lần ghi** |

**Nửa SOLVE**, chạy bằng `python solver/evaForMedicine.py`:

| Bước | Component | Input → Output |
|---|---|---|
| 1 | `lf_kag_static_planner` (**LLM**) | câu hỏi → Task DAG, đại ý `Retrieval(s=s1:Disease[甲状腺结节], p=p1:applicableMedicine, o=o1:Medicine)` |
| 2 | `kg_cs` exact one-hop | logical form → tìm đúng cạnh `applicableMedicine` trong đồ thị |
| 3 | `kg_fr` fuzzy one-hop + `ppr_chunk_retriever` | nếu cạnh thiếu → chạy personalized PageRank từ thực thể lan sang node Chunk; **đây chính là chỗ chỉ mục hai chiều được dùng** |
| 4 | `rc` vector chunk retriever | câu hỏi → chunk giống nhất theo embedding |
| 5 | `kag_merger` | 3 nguồn trên → một danh sách bằng chứng đã gộp và xếp hạng |
| 6 | `llm_index_generator` (**LLM**) | bằng chứng + lịch sử từng bước → câu trả lời kèm `reference` |

Điểm mấu chốt: câu hỏi này trả lời được vì `schema/Medicine.schema` **đã khai báo sẵn** property `applicableMedicine` trên `Disease`. Schema quyết định câu hỏi nào trả lời tốt.

### Static vs iterative pipeline

- **Static** (`kag/solver/pipeline/kag_static_pipeline.py`): planner sinh **toàn bộ** kế hoạch một lần, các Task cùng bậc chạy song song bằng `asyncio.gather`, xong mới sinh câu trả lời. Nếu `finish_judger` chấm là chưa đạt thì **lập lại kế hoạch từ đầu**, không vá thêm.
- **Iterative** (`kag/solver/pipeline/kag_iterative_pipeline.py`): mỗi vòng planner chỉ sinh **một Task kế tiếp** dựa trên những gì đã biết, chạy ngay, rồi lặp. Kiểu ReAct. Kết thúc khi planner chọn `finish_executor` hoặc chạm `max_iteration`.
- Chọn thế nào: static rẻ hơn và song song được, hợp câu hỏi mà bạn đoán trước được hình dạng lời giải. Iterative đắt hơn nhưng chịu được câu hỏi mà bước sau phụ thuộc kết quả bước trước.

---

## 4. Áp dụng

### Muốn chạy trên dữ liệu của bạn thì đụng vào đâu

Copy `kag/examples/medicine/` thành thư mục mới, rồi sửa đúng 6 chỗ:

1. `schema/<Ten>.schema` — khai báo entity type, concept type, relation. **Đây là file quan trọng nhất**, nó quyết định câu hỏi nào trả lời được.
2. `builder/data/` — dữ liệu thật, CSV hoặc file văn bản.
3. `kag_config.yaml` — API key và endpoint của LLM cùng model embedding, tên project, danh sách component.
4. `builder/prompt/{ner,std,triple}.py` — prompt riêng cho domain, kèm ví dụ few-shot bằng đúng từ vựng ngành của bạn.
5. `builder/indexer.py` — khai báo file nào đi đường có cấu trúc, file nào đi đường trích bằng LLM.
6. `solver/evaForMedicine.py` — đổi câu hỏi, hoặc thay bằng vòng lặp đọc từ file.

Chỉ khi cần logic đặc thù mới phải đụng vào `kag/builder/component/extractor/` hoặc `kag/solver/pipelineconf/*.yaml`.

Các lệnh chạy (theo README của example):

```bash
knext project restore --host_addr http://127.0.0.1:8887 --proj_path .
knext schema commit
cd builder && python indexer.py && cd ..
cd solver && python evaForMedicine.py && cd ..
```

### 3 tình huống NÊN dùng KAG

- Domain hẹp, có chuyên gia sẵn sàng ngồi định nghĩa schema. Y khoa, pháp lý, tài chính doanh nghiệp.
- Câu hỏi thường xuyên bắc cầu nhiều bước, so sánh, hoặc có tính toán số.
- Bắt buộc phải truy nguồn được từng câu trả lời về đoạn văn gốc.

### 3 tình huống KHÔNG nên, dùng RAG thường cho rẻ

- Câu hỏi chủ yếu là "tìm đoạn nói về X". Một lượt vector là đủ.
- Corpus thay đổi liên tục hàng ngày. Chi phí build lại đồ thị sẽ giết bạn.
- Không có ai đủ hiểu domain để viết schema. Không schema thì KAG tụt về gần bằng GraphRAG mà vẫn phải nuôi Docker.

### Chi phí và phụ thuộc cần biết trước

- **Docker bắt buộc.** Phải chạy OpenSPG engine trước, tải compose file từ repo `OpenSPG/openspg`, không có trong repo KAG.
- **Số lần gọi LLM khi build**: `schema_free_extractor` gọi **3 lần cho mỗi chunk** (NER, chuẩn hóa, trích triple (bộ ba)). 10.000 chunk là 30.000 lần gọi. Dữ liệu đã có cấu trúc thì đi đường `spg_mapping` / `spo_mapping`, **không tốn lần gọi nào**.
- **Số lần gọi LLM khi hỏi**: khoảng 4 đến 10 cho mỗi câu, gồm planner, rewrite, tóm tắt trong executor, deduce, generator, finish_judger. Con số chính xác tùy pipeline, **chưa xác minh** bằng đo thực tế.
- **Thời gian build**: repo có checkpoint theo hash nội dung ở `kag/builder/runner.py`, chạy lại không tốn lại tiền cho phần đã xong. Thời gian tuyệt đối **chưa xác minh**, phụ thuộc độ trễ LLM và `num_chains` trong config.
- README gốc quảng cáo chế độ "Lightweight Build" giảm 89% chi phí token. Đây là con số duy nhất trong README gốc, không kèm điều kiện đo.

---

## 5. Bản tóm tắt 10 dòng để giảng lại

1. RAG thường cắt tài liệu thành đoạn, tìm bằng độ giống nhau, một lượt, nên chết ở câu hỏi cần nối hai mẩu thông tin.
2. GraphRAG có đồ thị nhưng trích tự do, tên thực thể không chuẩn hóa, đồ thị nhiễu.
3. KAG là RAG có đồ thị **ràng buộc bởi schema do chuyên gia khai báo trước**.
4. Ý tưởng số một: đồ thị và văn bản gốc trỏ ngược lẫn nhau, gọi là chỉ mục hai chiều.
5. Ý tưởng số hai: câu hỏi được dịch thành kế hoạch nhiều bước gọi là logical form, rồi mới đi tìm.
6. Nửa BUILD có bảy bước: quét, đọc, cắt, trích, gióng hàng, nhúng vector, ghi. Chỉ bước trích gọi LLM.
7. Nửa SOLVE có ba khối: planner chia việc, executor đi tìm bằng ba kiểu truy hồi rồi gộp, generator viết câu trả lời kèm nguồn.
8. Kiến trúc gồm KAG chạy Python, knext làm client REST, OpenSPG engine chạy Docker giữ đồ thị và vector.
9. File quan trọng nhất khi áp dụng là file schema, vì nó quyết định câu hỏi nào trả lời được.
10. Dùng KAG khi domain hẹp, câu hỏi nhiều bước, cần truy nguồn. Dùng RAG thường khi chỉ cần tìm đoạn và dữ liệu đổi liên tục.

---

## Những chỗ chưa xác minh

- Danh sách service Docker của OpenSPG engine (compose file nằm ở repo `OpenSPG/openspg`, không có trong repo KAG).
- Số lần gọi LLM chính xác cho mỗi câu hỏi.
- Thời gian build index thực tế.
