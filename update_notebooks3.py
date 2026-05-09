import json
import os

def create_notebook(filename, cells):
    nb = {
        "nbformat": 4,
        "nbformat_minor": 0,
        "metadata": {
            "colab": {"name": os.path.basename(filename)},
            "kernelspec": {"name": "python3", "display_name": "Python 3"}
        },
        "cells": []
    }
    for cell_type, source in cells:
        lines = [line + "\n" for line in source.split("\n")]
        if lines:
            lines[-1] = lines[-1].rstrip("\n")
            
        cell = {
            "cell_type": cell_type,
            "metadata": {},
            "source": lines
        }
        if cell_type == "code":
            cell["execution_count"] = None
            cell["outputs"] = []
        nb["cells"].append(cell)
    
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2, ensure_ascii=False)

finetune_cells = [
    ("markdown", "# Fine-tune Whisper (PhoWhisper) cho Tiếng Việt\n\nNotebook này hướng dẫn bạn cách fine-tune mô hình `vinai/PhoWhisper-small` bằng tập dữ liệu `google/fleurs` (tiếng Việt). Đã cập nhật để khắc phục các lỗi với thư viện mới (datasets, transformers)."),
    ("code", "!pip install --upgrade pip\n# BẮT BUỘC dùng datasets < 3.0.0 để tránh lỗi 'Dataset scripts are no longer supported'\n!pip install \"datasets<3.0.0\" transformers accelerate evaluate jiwer librosa soundfile"),
    ("markdown", "## 1. Kết nối Google Drive để lưu model"),
    ("code", "from google.colab import drive\ndrive.mount('/content/drive')\n\n# Đường dẫn lưu model trên Drive (bạn có thể thay đổi)\nOUTPUT_DIR = '/content/drive/MyDrive/STT_Vietnamese_Model_Finetuned'"),
    ("markdown", "## 2. Chuẩn bị dữ liệu"),
    ("code", "from datasets import load_dataset, Audio\n\n# Tải tập dữ liệu google/fleurs tiếng Việt (chỉ lấy tập train và validation nhỏ để chạy thử, bạn nên tăng kích thước sau)\nprint('Đang tải dữ liệu...')\ntrain_dataset = load_dataset('google/fleurs', 'vi_vn', split='train[:5%]', trust_remote_code=True)\ntest_dataset = load_dataset('google/fleurs', 'vi_vn', split='test[:5%]', trust_remote_code=True)\n\n# Resample audio về 16kHz (tần số chuẩn của Whisper)\ntrain_dataset = train_dataset.cast_column('audio', Audio(sampling_rate=16000))\ntest_dataset = test_dataset.cast_column('audio', Audio(sampling_rate=16000))"),
    ("markdown", "## 3. Khởi tạo Processor, Feature Extractor và Tokenizer"),
    ("code", "from transformers import WhisperFeatureExtractor, WhisperTokenizer, WhisperProcessor\n\nmodel_id = 'vinai/PhoWhisper-small'  # Sử dụng PhoWhisper cho tiếng Việt\n\nfeature_extractor = WhisperFeatureExtractor.from_pretrained(model_id)\ntokenizer = WhisperTokenizer.from_pretrained(model_id, language='vi', task='transcribe')\nprocessor = WhisperProcessor.from_pretrained(model_id, language='vi', task='transcribe')"),
    ("markdown", "## 4. Xử lý dữ liệu (Feature Extraction & Tokenization)"),
    ("code", "def prepare_dataset(batch):\n    # load and resample audio data from 48 to 16kHz\n    audio = batch['audio']\n\n    # compute log-Mel input features from input audio array \n    batch['input_features'] = feature_extractor(audio['array'], sampling_rate=audio['sampling_rate']).input_features[0]\n\n    # encode target text to label ids \n    # Fleurs thường chứa text ở cột 'transcription' hoặc 'raw_transcription'\n    text = batch.get('transcription', batch.get('raw_transcription', batch.get('sentence', '')))\n    batch['labels'] = tokenizer(text).input_ids\n    return batch\n\ntrain_dataset = train_dataset.map(prepare_dataset, remove_columns=train_dataset.column_names)\ntest_dataset = test_dataset.map(prepare_dataset, remove_columns=test_dataset.column_names)"),
    ("markdown", "## 5. Khởi tạo Mô hình và Data Collator"),
    ("code", "import torch\nfrom dataclasses import dataclass\nfrom typing import Any, Dict, List, Union\nfrom transformers import WhisperForConditionalGeneration\n\n@dataclass\nclass DataCollatorSpeechSeq2SeqWithPadding:\n    processor: Any\n\n    def __call__(self, features: List[Dict[str, Union[List[int], torch.Tensor]]]) -> Dict[str, torch.Tensor]:\n        input_features = [{'input_features': feature['input_features']} for feature in features]\n        batch = self.processor.feature_extractor.pad(input_features, return_tensors='pt')\n\n        label_features = [{'input_ids': feature['labels']} for feature in features]\n        labels_batch = self.processor.tokenizer.pad(label_features, return_tensors='pt')\n\n        labels = labels_batch['input_ids'].masked_fill(labels_batch.attention_mask.ne(1), -100)\n        if (labels[:, 0] == self.processor.tokenizer.bos_token_id).all().cpu().item():\n            labels = labels[:, 1:]\n        batch['labels'] = labels\n\n        return batch\n\ndata_collator = DataCollatorSpeechSeq2SeqWithPadding(processor=processor)\n\nmodel = WhisperForConditionalGeneration.from_pretrained(model_id)\nmodel.config.forced_decoder_ids = None\nmodel.config.suppress_tokens = []"),
    ("markdown", "## 6. Định nghĩa hàm đánh giá (Metrics)"),
    ("code", "import evaluate\n\nmetric = evaluate.load('wer')\n\ndef compute_metrics(pred):\n    pred_ids = pred.predictions\n    label_ids = pred.label_ids\n\n    label_ids[label_ids == -100] = tokenizer.pad_token_id\n    pred_str = tokenizer.batch_decode(pred_ids, skip_special_tokens=True)\n    label_str = tokenizer.batch_decode(label_ids, skip_special_tokens=True)\n\n    wer = 100 * metric.compute(predictions=pred_str, references=label_str)\n    return {'wer': wer}"),
    ("markdown", "## 7. Cấu hình Training và Bắt đầu Huấn luyện"),
    ("code", "from transformers import Seq2SeqTrainingArguments, Seq2SeqTrainer\n\ntraining_args = Seq2SeqTrainingArguments(\n    output_dir=OUTPUT_DIR,\n    per_device_train_batch_size=8,\n    gradient_accumulation_steps=2,\n    learning_rate=1e-5,\n    warmup_steps=100,\n    max_steps=500, # Thay đổi số steps lớn hơn khi train thực tế\n    gradient_checkpointing=True,\n    fp16=True,\n    eval_strategy='steps',\n    per_device_eval_batch_size=8,\n    predict_with_generate=True,\n    generation_max_length=225,\n    save_steps=200,\n    eval_steps=200,\n    logging_steps=25,\n    report_to=['tensorboard'],\n    load_best_model_at_end=True,\n    metric_for_best_model='wer',\n    greater_is_better=False,\n    push_to_hub=False,\n)\n\ntrainer = Seq2SeqTrainer(\n    args=training_args,\n    model=model,\n    train_dataset=train_dataset,\n    eval_dataset=test_dataset,\n    data_collator=data_collator,\n    compute_metrics=compute_metrics,\n    tokenizer=processor.feature_extractor,\n)\n\nprint('Bắt đầu huấn luyện...')\ntrainer.train()"),
    ("markdown", "## 8. Lưu mô hình"),
    ("code", "# Mô hình được tự động lưu vào OUTPUT_DIR đã chỉ định ở Google Drive do quá trình train.\n# Bạn cũng có thể lưu thủ công bản cuối cùng:\nmodel.save_pretrained(OUTPUT_DIR + '/final')\nprocessor.save_pretrained(OUTPUT_DIR + '/final')\nprint('Hoàn thành! Model đã được lưu tại Drive.')")
]

scratch_cells = [
    ("markdown", "# Train Whisper từ đầu (Train from scratch) cho Tiếng Việt\n\nSử dụng dataset `google/fleurs` tiếng Việt. Đã cập nhật để khắc phục các lỗi thư viện mới."),
    ("code", "!pip install --upgrade pip\n# BẮT BUỘC dùng datasets < 3.0.0 để tránh lỗi 'Dataset scripts are no longer supported'\n!pip install \"datasets<3.0.0\" transformers accelerate evaluate jiwer librosa soundfile"),
    ("markdown", "## 1. Kết nối Google Drive để lưu model"),
    ("code", "from google.colab import drive\ndrive.mount('/content/drive')\nOUTPUT_DIR = '/content/drive/MyDrive/STT_Vietnamese_Model_Scratch'"),
    ("markdown", "## 2. Chuẩn bị dữ liệu"),
    ("code", "from datasets import load_dataset, Audio\n\nprint('Đang tải dữ liệu...')\ntrain_dataset = load_dataset('google/fleurs', 'vi_vn', split='train[:5%]', trust_remote_code=True)\ntest_dataset = load_dataset('google/fleurs', 'vi_vn', split='test[:5%]', trust_remote_code=True)\n\ntrain_dataset = train_dataset.cast_column('audio', Audio(sampling_rate=16000))\ntest_dataset = test_dataset.cast_column('audio', Audio(sampling_rate=16000))"),
    ("markdown", "## 3. Khởi tạo Processor (từ Whisper chuẩn)"),
    ("code", "from transformers import WhisperFeatureExtractor, WhisperTokenizer, WhisperProcessor\n\nfeature_extractor = WhisperFeatureExtractor.from_pretrained('openai/whisper-small')\ntokenizer = WhisperTokenizer.from_pretrained('openai/whisper-small', language='vi', task='transcribe')\nprocessor = WhisperProcessor.from_pretrained('openai/whisper-small', language='vi', task='transcribe')"),
    ("markdown", "## 4. Xử lý dữ liệu"),
    ("code", "def prepare_dataset(batch):\n    audio = batch['audio']\n    batch['input_features'] = feature_extractor(audio['array'], sampling_rate=audio['sampling_rate']).input_features[0]\n    text = batch.get('transcription', batch.get('raw_transcription', batch.get('sentence', '')))\n    batch['labels'] = tokenizer(text).input_ids\n    return batch\n\ntrain_dataset = train_dataset.map(prepare_dataset, remove_columns=train_dataset.column_names)\ntest_dataset = test_dataset.map(prepare_dataset, remove_columns=test_dataset.column_names)"),
    ("markdown", "## 5. Khởi tạo Mô hình MỚI (Từ đầu)"),
    ("code", "import torch\nfrom dataclasses import dataclass\nfrom typing import Any, Dict, List, Union\nfrom transformers import WhisperConfig, WhisperForConditionalGeneration\n\n@dataclass\nclass DataCollatorSpeechSeq2SeqWithPadding:\n    processor: Any\n\n    def __call__(self, features: List[Dict[str, Union[List[int], torch.Tensor]]]) -> Dict[str, torch.Tensor]:\n        input_features = [{'input_features': feature['input_features']} for feature in features]\n        batch = self.processor.feature_extractor.pad(input_features, return_tensors='pt')\n\n        label_features = [{'input_ids': feature['labels']} for feature in features]\n        labels_batch = self.processor.tokenizer.pad(label_features, return_tensors='pt')\n\n        labels = labels_batch['input_ids'].masked_fill(labels_batch.attention_mask.ne(1), -100)\n        if (labels[:, 0] == self.processor.tokenizer.bos_token_id).all().cpu().item():\n            labels = labels[:, 1:]\n        batch['labels'] = labels\n\n        return batch\n\ndata_collator = DataCollatorSpeechSeq2SeqWithPadding(processor=processor)\n\nconfig = WhisperConfig.from_pretrained('openai/whisper-small')\nmodel = WhisperForConditionalGeneration(config)\nmodel.config.forced_decoder_ids = None\nmodel.config.suppress_tokens = []"),
    ("markdown", "## 6. Metrics và Huấn luyện"),
    ("code", "import evaluate\nmetric = evaluate.load('wer')\n\ndef compute_metrics(pred):\n    pred_ids = pred.predictions\n    label_ids = pred.label_ids\n    label_ids[label_ids == -100] = tokenizer.pad_token_id\n    pred_str = tokenizer.batch_decode(pred_ids, skip_special_tokens=True)\n    label_str = tokenizer.batch_decode(label_ids, skip_special_tokens=True)\n    wer = 100 * metric.compute(predictions=pred_str, references=label_str)\n    return {'wer': wer}\n\nfrom transformers import Seq2SeqTrainingArguments, Seq2SeqTrainer\n\ntraining_args = Seq2SeqTrainingArguments(\n    output_dir=OUTPUT_DIR,\n    per_device_train_batch_size=8,\n    gradient_accumulation_steps=2,\n    learning_rate=1e-4, \n    warmup_steps=500,\n    max_steps=1000,\n    gradient_checkpointing=True,\n    fp16=True,\n    eval_strategy='steps',\n    per_device_eval_batch_size=8,\n    predict_with_generate=True,\n    generation_max_length=225,\n    save_steps=200,\n    eval_steps=200,\n    logging_steps=25,\n    report_to=['tensorboard'],\n    load_best_model_at_end=True,\n    metric_for_best_model='wer',\n    greater_is_better=False,\n)\n\ntrainer = Seq2SeqTrainer(\n    args=training_args,\n    model=model,\n    train_dataset=train_dataset,\n    eval_dataset=test_dataset,\n    data_collator=data_collator,\n    compute_metrics=compute_metrics,\n    tokenizer=processor.feature_extractor,\n)\n\nprint('Bắt đầu huấn luyện từ đầu...')\ntrainer.train()\n\nmodel.save_pretrained(OUTPUT_DIR + '/final')\nprocessor.save_pretrained(OUTPUT_DIR + '/final')\nprint('Hoàn thành! Model đã được lưu tại Drive.')")
]

create_notebook("notebooks/train_stt_vietnamese_finetune.ipynb", finetune_cells)
create_notebook("notebooks/train_stt_vietnamese_from_scratch.ipynb", scratch_cells)
print("Notebooks updated successfully with eval_strategy!")
