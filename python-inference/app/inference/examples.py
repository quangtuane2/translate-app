import os
import json
from typing import List, Dict

class ExampleExtractor:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        # Load all available data to maximize search results
        self.bahnaric_data = self._load_all_json("colab_dataset_bahnaric")
        self.ede_data = self._load_all_json("colab_dataset_ede")

    def _load_all_json(self, folder_name):
        combined_data = []
        folder_path = os.path.join(self.base_dir, folder_name)
        if not os.path.exists(folder_path):
            print(f"Warning: Folder {folder_path} not found.")
            return []
        
        # Load train, valid, and test splits
        for filename in ["train_data.json", "valid_data.json", "test_data.json"]:
            path = os.path.join(folder_path, filename)
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            combined_data.extend(data)
                except Exception as e:
                    print(f"Error loading {path}: {e}")
        
        print(f"Loaded {len(combined_data)} examples for {folder_name}")
        return combined_data

    def get_examples(self, query: str, source_lang: str, target_lang: str, limit: int = 5) -> List[Dict[str, str]]:
        query = query.strip().lower()
        if not query:
            return []

        # Normalize language codes
        sl = (source_lang or "").strip().lower()
        tl = (target_lang or "").strip().lower()
        
        results = []
        dataset = []
        is_bahnaric = False
        is_ede = False
        
        # Broad matching for Bahnaric and Ede language codes
        if any(x in sl or x in tl for x in ["ba", "bna", "ban"]):
            dataset = self.bahnaric_data
            is_bahnaric = True
        elif any(x in sl or x in tl for x in ["ede", "rhade", "rad"]):
            dataset = self.ede_data
            is_ede = True
            
        if not dataset:
            return []

        for item in dataset:
            vi_text = str(item.get("vi", "")).lower()
            target_text = ""
            
            # Ethnic field name check
            if is_bahnaric:
                target_text = str(item.get("ba", "")).lower()
            elif is_ede:
                target_text = str(item.get("ede", "")).lower()
                
            # Search in both Vietnamese and ethnic language
            if query in vi_text or (target_text and query in target_text):
                results.append({
                    "vi": item.get("vi"),
                    "ethnic": item.get("ba") if is_bahnaric else item.get("ede")
                })
            
            if len(results) >= limit:
                break
                
        return results

example_extractor = ExampleExtractor()
