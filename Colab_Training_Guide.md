# Hướng Dẫn Huấn Luyện NMT (BARTpho) Trên Google Colab

Vì máy tính của bạn không có đủ GPU, bạn có thể sử dụng Google Colab miễn phí để huấn luyện mô hình học sâu.

## Các Bước Chuẩn Bị Chung
1. Zip thư mục `colab_dataset` (chứa 3 file `train_data.json`, `valid_data.json`, `test_data.json`) thành `colab_dataset.zip`.
2. Truy cập [Google Colab](https://colab.research.google.com/).
3. Bấm **File -> New notebook** (Tạo sổ tay mới).
4. Ở thanh menu, bấm **Runtime -> Change runtime type**. Chọn phần cứng là **T4 GPU** (hoặc GPU bất kỳ có sẵn) và lưu lại.
5. Upload file `colab_dataset.zip` lên phần **Files** ở thanh bên trái của Colab.

---

## MÔ HÌNH 1: DỊCH TỪ TIẾNG VIỆT SANG TIẾNG BA NA (Việt ➡️ Ba Na)
*(Nếu bạn đã train và có `best-bana-model`, bạn có thể bỏ qua phần này)*

*Các đoạn code như cũ... (xem các phần bên dưới, giữ nguyên cấu trúc)*

---

## MÔ HÌNH 2: DỊCH TỪ TIẾNG BA NA SANG TIẾNG VIỆT (Ba Na ➡️ Việt)

Để train mô hình dịch ngược, bạn mở một file Notebook mới trên Colab, làm lại Bước Chuẩn bị để tải `colab_dataset.zip` lên.
Sau đó, copy các ô code như phần Mô Hình 1, **NHƯNG chú ý thay đổi ở Ô Code 4 và Ô Code 6** như sau:

### Ô Code 4 (Sửa đổi): Tiền xử lý dữ liệu (Đảo ngược Input và Target)
```python
max_length = 256

def preprocess_function_bana_to_vi(examples):
    # ĐẢO NGƯỢC: Input là tiếng Ba Na, Target là tiếng Việt
    inputs = [ex for ex in examples["ba"]]
    targets = [ex for ex in examples["vi"]]
    
    model_inputs = tokenizer(inputs, max_length=max_length, truncation=True)
    
    # Setup the tokenizer for targets
    labels = tokenizer(text_target=targets, max_length=max_length, truncation=True)
        
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

tokenized_datasets = datasets.map(preprocess_function_bana_to_vi, batched=True)
```

### Ô Code 5: Huấn luyện
*(Giữ nguyên như Ô Code 5 của Mô hình 1)*

### Ô Code 6 (Sửa đổi): Lưu mô hình tiếng Việt
```python
# Lưu mô hình với tên mới
trainer.save_model("./best-vi-model")

# Nén mô hình để tải về
!zip -r best-vi-model.zip best-vi-model/
```

Sau khi chạy xong Ô Code 6, bạn tải file `best-vi-model.zip` về, giải nén vào thư mục `python-inference/models/best-vi-model` trong dự án. Lúc này hệ thống của bạn sẽ có 2 thư mục model là `best-bana-model` và `best-vi-model`.

---

## KỊCH BẢN CHUNG CHO CÁC Ô CODE CÒN LẠI

### Ô Code 1: Cài đặt các thư viện cần thiết
```python
!pip install transformers datasets sentencepiece accelerate underthesea
```

### Ô Code 2: Giải nén dữ liệu
```python
!unzip colab_dataset.zip
```

### Ô Code 3: Load dữ liệu và Mô hình
```python
import json
from datasets import Dataset, DatasetDict
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, Seq2SeqTrainingArguments, Seq2SeqTrainer, DataCollatorForSeq2Seq

# 1. Load Dataset
def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

train_data = load_json('colab_dataset/train_data.json')
valid_data = load_json('colab_dataset/valid_data.json')

# Biến đổi thành HuggingFace Dataset
train_dataset = Dataset.from_list(train_data)
valid_dataset = Dataset.from_list(valid_data)

datasets = DatasetDict({
    "train": train_dataset,
    "validation": valid_dataset
})

# 2. Load Tokenizer & Model (vinai/bartpho-word)
model_checkpoint = "vinai/bartpho-word"
tokenizer = AutoTokenizer.from_pretrained(model_checkpoint)
model = AutoModelForSeq2SeqLM.from_pretrained(model_checkpoint)

# Đóng băng Encoder để tăng tốc độ huấn luyện giống bài báo
for param in model.model.encoder.parameters():
    param.requires_grad = False
```

### Ô Code 4: Tiền xử lý dữ liệu (Tokenization)
```python
max_length = 256

def preprocess_function(examples):
    inputs = [ex for ex in examples["vi"]]
    targets = [ex for ex in examples["ba"]]
    
    model_inputs = tokenizer(inputs, max_length=max_length, truncation=True)
    
    # Setup the tokenizer for targets
    labels = tokenizer(text_target=targets, max_length=max_length, truncation=True)
        
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

tokenized_datasets = datasets.map(preprocess_function, batched=True)
```

### Ô Code 5: Cấu hình Huấn Luyện (Training)
```python
data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

training_args = Seq2SeqTrainingArguments(
    output_dir="./bartpho-bana-nmt",
    eval_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    weight_decay=0.01,
    save_total_limit=3,
    num_train_epochs=10, # Chỉnh số epoch tuỳ ý, bài báo là 21 epoch
    predict_with_generate=True,
    fp16=True, # Dùng Mixed Precision để train nhanh hơn trên GPU
)

trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["validation"],
    data_collator=data_collator,
)

# Bắt đầu huấn luyện
trainer.train()
```

### Ô Code 6: Lưu mô hình về máy tính
```python
# Lưu mô hình
trainer.save_model("./best-bana-model")

# Nén mô hình để tải về
!zip -r best-bana-model.zip best-bana-model/
```

Sau khi chạy xong Ô Code 6, bạn tải file `best-bana-model.zip` ở cột Files bên trái về máy tính. Giải nén vào thư mục `python-inference/models/best-bana-model` trong dự án của bạn!
