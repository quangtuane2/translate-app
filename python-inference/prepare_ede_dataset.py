import pandas as pd
import json
import os

# Đường dẫn tới thư mục data mà bạn vừa tải về
data_dir = r"E:\devpro\JavaSpringBoot\translate-app\dataset-rhade"

# Nơi sẽ lưu 3 file json đầu ra (tạo thư mục nếu chưa có)
output_dir = "colab_dataset_ede"
os.makedirs(output_dir, exist_ok=True)

# Map tên file đầu ra với tên file parquet gốc
files_map = {
    "train_data.json": "train-00000-of-00001.parquet",
    "valid_data.json": "validation-00000-of-00001.parquet",
    "test_data.json": "test-00000-of-00001.parquet"
}

print("Bắt đầu chuyển đổi dữ liệu tiếng Ê-đê...")

for json_name, parquet_name in files_map.items():
    parquet_path = os.path.join(data_dir, parquet_name)
    if not os.path.exists(parquet_path):
        print(f"⚠️ Không tìm thấy file: {parquet_path}")
        continue
        
    # Đọc file parquet bằng pandas
    df = pd.read_parquet(parquet_path)
    
    json_data = []
    
    for _, row in df.iterrows():
        # Dữ liệu dịch máy trên HuggingFace thường có 2 định dạng:
        # 1. Nằm trong một cột duy nhất tên là 'translation' chứa dict {'vi': '...', 'rad': '...'}
        if 'translation' in df.columns:
            pair = row['translation']
            vi_text = pair.get('vi', pair.get('vn', ''))
            # Mã ngôn ngữ của Ê-đê thường là 'rad' (Rhade) hoặc 'ede'
            ede_text = pair.get('rad', pair.get('ede', pair.get('rhade', '')))
        
        # 2. Chia làm nhiều cột riêng biệt (ví dụ cột 'vi' và cột 'rad')
        else:
            vi_col = next((col for col in df.columns if col.lower() in ['vi', 'vn', 'vietnamese']), None)
            ede_col = next((col for col in df.columns if col.lower() in ['rad', 'ede', 'rhade']), None)
            
            vi_text = row[vi_col] if vi_col else ""
            ede_text = row[ede_col] if ede_col else ""
            
        # Bỏ qua các dòng bị lỗi (dữ liệu rỗng)
        if pd.isna(vi_text) or pd.isna(ede_text):
            continue
            
        json_data.append({
            "vi": str(vi_text).strip(),
            "ede": str(ede_text).strip()
        })
        
    output_path = os.path.join(output_dir, json_name)
    with open(output_path, 'w', encoding='utf-8') as f:
        # ensure_ascii=False để không bị lỗi font tiếng Việt / Ê-đê
        json.dump(json_data, f, ensure_ascii=False, indent=2)
        
    print(f"✅ Đã tạo thành công {output_path} với {len(json_data)} cặp câu.")

print("\nHoàn tất! Bạn có thể nén thư mục 'colab_dataset_ede' thành file .zip để đưa lên Colab.")
