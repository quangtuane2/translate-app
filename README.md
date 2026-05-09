# VN ↔ Ba Na Translator (Demo NMT Architecture)

Ứng dụng web dịch thuật giao diện kiểu Google Dịch (2 ô nhập/xuất), kèm backend REST để gọi dịch theo kiến trúc:
`Frontend (UI) -> Java Spring Boot API (/api/translate) -> Python FastAPI Inference (/internal/translate)`.

Hiện tại phần “dịch thật” đang là **placeholder** (hook) để chạy end-to-end. Bạn có thể thay bằng model Transformer fine-tuned ở bước tiếp theo.

## Kiến trúc & Luồng API

```text
POST /api/translate (Java)
  -> forward sang
POST /internal/translate (Python)
  -> trả JSON về { translatedText, sourceLang, targetLang }
```

## Yêu cầu

- Python 3.10+ (trong máy hiện có Python 3.14)
- Java 17+ (trong máy hiện có Java 24)
- Maven 3.8+

## Chạy dịch vụ

### 0) Build UI React/Vite (nếu bạn vừa thay code frontend)

```powershell
cd frontend
npm install
npm run build
```

Sau khi build, script `postbuild` sẽ tự copy `frontend/dist` sang `backend-java/src/main/resources/static/` để Spring Boot phục vụ giao diện mới.

### 1) Chạy Python (FastAPI)

```powershell
cd python-inference
.\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8001
```

- Endpoint: `POST http://127.0.0.1:8001/internal/translate`

### 2) Chạy Java (Spring Boot)

```powershell
cd backend-java
mvn -f pom.xml spring-boot:run -DskipTests
```

- Java phục vụ UI tại: `http://127.0.0.1:8080/`
- Endpoint: `POST http://127.0.0.1:8080/api/translate`

> Lưu ý: nếu bạn đã chạy Python ở bước 1 thì Java sẽ gọi sang Python theo `python.baseUrl` (mặc định `http://localhost:8001` trong `application.properties`).

## Dữ liệu API (Contract)

### Request (Java/Python)

```json
{
  "text": "Xin chao",
  "sourceLang": "vi",
  "targetLang": "bna"
}
```

Ngôn ngữ đang hỗ trợ demo:
- `vi`: Tiếng Việt
- `bna`: Tiếng Ba Na

### Response (200)

```json
{
  "translatedText": "[BaNa-demo] Xin chao",
  "sourceLang": "vi",
  "targetLang": "bna"
}
```

### Error (400 Validation)

```json
{
  "message": "Validation failed",
  "details": ["text: Text must not be empty."]
}
```

## Thay placeholder bằng model Transformer local (Gợi ý)

File hook hiện tại nằm ở:
- `python-inference/app/inference/translator.py`

Bạn chỉ cần thay hàm `translate(text, source_lang, target_lang)` để:
1. Load tokenizer/model đã fine-tune (ví dụ từ thư mục model local).
2. Tokenize input -> chạy inference -> decode output thành chuỗi dịch.
3. Trả về `translated_text`.

Sau khi cập nhật, frontend và Java API sẽ tự động dùng bản dịch thật mà không cần đổi lại contract.

Hướng dẫn clone về & cài thư viện

# 1. Clone project
git clone https://github.com/quangtuane2/translate-app.git
cd translate-app

# 2. Cài Python dependencies
cd python-inference
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt

# 3. Cài Node.js dependencies
cd ../frontend
npm install

# 4. Build Java (Maven tự tải dependencies)
cd ../backend-java
mvn install

# dowloand model AI
https://drive.google.com/drive/folders/1M5o-T0alc5zGt8IGBH5am4ew7Ej5kxlO?usp=sharing
# lưu tất cả các model vào đường dẫn sau: python-inference/models/
