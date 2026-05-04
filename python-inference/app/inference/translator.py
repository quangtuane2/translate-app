import os
from .segmenter import Segmenter

# Load Segmenter
# __file__ is translate-app/python-inference/app/inference/translator.py
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
dict_vi_path = os.path.join(base_dir, "dataset", "dictionary", "dict.vi")
dict_ba_path = os.path.join(base_dir, "dataset", "dictionary", "dict.ba")
segmenter = Segmenter(dict_vi_path, dict_ba_path)

import gc

try:
    import torch
except ImportError:
    torch = None

# Try to load Transformer Models
# Model directories are now managed inside ModelManager

class ModelManager:
    def __init__(self):
        self.current_direction = None
        self.model = None
        self.tokenizer = None
        
        # Base paths for models
        self.model_dirs = {
            'vi-bana': os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models", "best-vntobana-model"),
            'bana-vi': os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models", "best-banatovn-model"),
            'vi-ede':  os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models", "best-vntoede-model"),
            'ede-vi':  os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models", "best-edetovn-model"),
        }

    def _clear_memory(self):
        """Clears memory before loading a new model to avoid RAM overflow."""
        if self.model is not None:
            del self.model
            self.model = None
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
            
        # Force garbage collection
        gc.collect()
        
        # Clear VRAM if PyTorch and CUDA are available (safe fallback for Intel Iris/CPU)
        if torch is not None and torch.cuda.is_available():
            torch.cuda.empty_cache()

    def get_model_and_tokenizer(self, direction: str):
        if self.current_direction == direction and self.model is not None and self.tokenizer is not None:
            return self.model, self.tokenizer

        print(f"Switching language to {direction}. Clearing old model from RAM...")
        self._clear_memory()
        
        model_dir = self.model_dirs.get(direction)
        if not model_dir or not os.path.exists(model_dir):
            print(f"Warning: Model for direction {direction} not found at {model_dir}.")
            return None, None
            
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            print(f"Loading {direction} model from: {model_dir}")
            self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_dir)
            self.current_direction = direction
            print("Model loaded successfully.")
            return self.model, self.tokenizer
        except Exception as e:
            print(f"Error loading {direction} model: {e}")
            self.current_direction = None
            return None, None

model_manager = ModelManager()

def _translate_chunk(chunk: str, direction: str) -> str:
    """Uses NMT model to translate a chunk based on direction ('vi-bana' or 'bana-vi')."""
    if not chunk.strip():
        return ""
    
    model, tokenizer = model_manager.get_model_and_tokenizer(direction)
    
    if model is not None and tokenizer is not None:
        inputs = tokenizer(chunk, return_tensors="pt", max_length=256, truncation=True)
        outputs = model.generate(**inputs, max_length=256)
        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return result
    return f"[Chunk: {chunk}]"

def translate(text: str, source_lang: str, target_lang: str) -> str:
    """
    Translates between supported language pairs using Segmentation + NMT (Ba-Na)
    or direct NMT (Ê-đê, no bilingual dictionary available).

    Supported directions:
      vi  -> bna / ban  (Vietnamese -> Ba-Na)
      bna / ban -> vi   (Ba-Na -> Vietnamese)
      vi  -> ede        (Vietnamese -> Ê-đê)
      ede -> vi         (Ê-đê -> Vietnamese)
    """
    normalized_source = (source_lang or "").strip().lower()
    normalized_target = (target_lang or "").strip().lower()

    clean = (text or "").strip()
    if not clean:
        return ""

    # ------------------------------------------------------------------
    # Vietnamese -> Ba-Na  (dictionary segmentation + NMT)
    # ------------------------------------------------------------------
    if normalized_source in {"vi", "vietnamese"} and normalized_target in {"bna", "ban"}:
        # 1. Segment Phase
        segments = segmenter.segment(clean)
        
        # 2. Mapping Phase
        translated_tokens = []
        for text_part, part_type in segments:
            if part_type == "ANCHOR":
                lower_text = text_part.lower()
                if lower_text in segmenter.dict_vi_to_ba:
                    translated_word = segmenter.dict_vi_to_ba[lower_text]
                    if text_part.istitle():
                        translated_word = translated_word.capitalize()
                    translated_tokens.append(translated_word)
                else:
                    translated_tokens.append(text_part)
            else:
                translated_chunk = _translate_chunk(text_part, 'vi-bana')
                translated_tokens.append(translated_chunk)
                
        # 3. Concatenate
        return " ".join(translated_tokens)

    # ------------------------------------------------------------------
    # Ba-Na -> Vietnamese  (dictionary segmentation + NMT)
    # ------------------------------------------------------------------
    if normalized_source in {"bna", "ban"} and normalized_target in {"vi", "vietnamese"}:
        # 1. Segment Phase (Ba-Na)
        segments = segmenter.segment_bana(clean)
        
        # 2. Mapping Phase
        translated_tokens = []
        for text_part, part_type in segments:
            if part_type == "ANCHOR":
                lower_text = text_part.lower()
                if lower_text in segmenter.dict_ba_to_vi:
                    translated_word = segmenter.dict_ba_to_vi[lower_text]
                    if text_part.istitle():
                        translated_word = translated_word.capitalize()
                    translated_tokens.append(translated_word)
                else:
                    translated_tokens.append(text_part)
            else:
                translated_chunk = _translate_chunk(text_part, 'bana-vi')
                translated_tokens.append(translated_chunk)
                
        # 3. Concatenate
        return " ".join(translated_tokens)

    # ------------------------------------------------------------------
    # Vietnamese -> Ê-đê  (direct NMT – no bilingual dictionary)
    # ------------------------------------------------------------------
    if normalized_source in {"vi", "vietnamese"} and normalized_target in {"ede", "rhade", "rad"}:
        return _translate_chunk(clean, 'vi-ede')

    # ------------------------------------------------------------------
    # Ê-đê -> Vietnamese  (direct NMT – no bilingual dictionary)
    # ------------------------------------------------------------------
    if normalized_source in {"ede", "rhade", "rad"} and normalized_target in {"vi", "vietnamese"}:
        return _translate_chunk(clean, 'ede-vi')

    # Generic fallback placeholder for unsupported directions
    return f"[{normalized_target or 'target'}-demo] {clean}"

