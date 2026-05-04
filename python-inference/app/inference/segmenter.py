import os
from underthesea import word_tokenize
from typing import List, Dict, Tuple
import sys

class Segmenter:
    def __init__(self, dict_vi_path: str, dict_ba_path: str):
        self.dict_vi_to_ba = {}
        self.dict_ba_to_vi = {}
        self.dict_vi_set = set()
        self.dict_ba_set = set()
        self.max_ba_phrase_len = 1
        self._load_dictionaries(dict_vi_path, dict_ba_path)

    def _load_dictionaries(self, dict_vi_path: str, dict_ba_path: str):
        """Loads parallel dictionary files into a hash map."""
        if not os.path.exists(dict_vi_path) or not os.path.exists(dict_ba_path):
            print(f"Warning: Dictionary files not found at {dict_vi_path} or {dict_ba_path}")
            return
            
        with open(dict_vi_path, 'r', encoding='utf-8') as f_vi, \
             open(dict_ba_path, 'r', encoding='utf-8') as f_ba:
            vi_words = f_vi.read().splitlines()
            ba_words = f_ba.read().splitlines()
            
            for vi, ba in zip(vi_words, ba_words):
                vi_clean = vi.strip().lower()
                ba_clean = ba.strip()
                ba_lower = ba_clean.lower()
                if vi_clean:
                    self.dict_vi_to_ba[vi_clean] = ba_clean
                    self.dict_vi_set.add(vi_clean)
                if ba_lower:
                    self.dict_ba_to_vi[ba_lower] = vi.strip()
                    self.dict_ba_set.add(ba_lower)
                    phrase_len = len(ba_lower.split())
                    if phrase_len > self.max_ba_phrase_len:
                        self.max_ba_phrase_len = phrase_len

    def is_anchor(self, word: str) -> bool:
        """
        Check if a word is an anchor.
        Anchors are:
        - Words present in the bilingual dictionary
        - Punctuation marks
        - Numbers
        (NER is simplified here, but we can assume capitalized words or unknown entities might be chunks or anchors depending on rule).
        For now, we use dictionary, numbers, punctuation.
        """
        w_lower = word.lower()
        if w_lower in self.dict_vi_set:
            return True
        if w_lower.isnumeric() or w_lower.replace(".", "", 1).replace(",", "", 1).isnumeric():
            return True
        if len(w_lower) == 1 and not w_lower.isalnum(): # Punctuation
            return True
        return False

    def segment(self, sentence: str) -> List[Tuple[str, str]]:
        """
        Segments a sentence into a list of tuples: (text, type)
        type can be 'ANCHOR' or 'CHUNK'
        """
        tokens = word_tokenize(sentence, format="text").split(" ")
        # underthesea word_tokenize with format="text" joins syllables of a word with underscore, e.g., "Trung_tâm"
        
        segments = []
        current_chunk = []

        for token in tokens:
            original_word = token.replace("_", " ") # Revert underscore
            if self.is_anchor(original_word):
                if current_chunk:
                    segments.append((" ".join(current_chunk), "CHUNK"))
                    current_chunk = []
                segments.append((original_word, "ANCHOR"))
            else:
                current_chunk.append(original_word)

        if current_chunk:
            segments.append((" ".join(current_chunk), "CHUNK"))

        return segments

    def is_anchor_bana(self, word: str) -> bool:
        """Helper to check punctuation/numbers for Ba Na tokens"""
        w_lower = word.lower()
        if w_lower.isnumeric() or w_lower.replace(".", "", 1).replace(",", "", 1).isnumeric():
            return True
        if len(w_lower) == 1 and not w_lower.isalnum():
            return True
        return False

    def segment_bana(self, sentence: str) -> List[Tuple[str, str]]:
        """
        Segments a Ba-Na sentence using greedy phrase matching.
        Returns a list of (text, type) where type is ANCHOR or CHUNK.
        """
        # Split by spaces (and try to isolate punctuation if needed, but for simplicity split by spaces)
        import re
        # Basic tokenization: split by spaces but keep punctuation separate
        tokens = re.findall(r"[\w'ăâđêôơư]+|[^\w\s'ăâđêôơư]", sentence)
        
        segments = []
        current_chunk = []
        
        i = 0
        n = len(tokens)
        while i < n:
            match_found = False
            # Greedy match
            for length in range(min(self.max_ba_phrase_len, n - i), 0, -1):
                phrase_tokens = tokens[i:i+length]
                # Try joining without spaces for punctuation, but mostly they are space separated
                # For dictionary matching, we usually match space-separated tokens
                # Wait, if tokens contains punctuation, joining them might add spaces incorrectly.
                # Actually, dict.ba entries rarely contain punctuation.
                phrase_str = " ".join(phrase_tokens).strip()
                phrase_lower = phrase_str.lower()
                
                # We need to handle cases where re.findall splits "12.5" into "12", ".", "5".
                # For simplicity, if length == 1, we check our basic anchor rule.
                if phrase_lower in self.dict_ba_set:
                    if current_chunk:
                        segments.append((" ".join(current_chunk), "CHUNK"))
                        current_chunk = []
                    segments.append((phrase_str, "ANCHOR"))
                    i += length
                    match_found = True
                    break
            
            if not match_found:
                token = tokens[i]
                if self.is_anchor_bana(token):
                    if current_chunk:
                        segments.append((" ".join(current_chunk), "CHUNK"))
                        current_chunk = []
                    segments.append((token, "ANCHOR"))
                else:
                    current_chunk.append(token)
                i += 1

        if current_chunk:
            segments.append((" ".join(current_chunk), "CHUNK"))

        return segments

if __name__ == "__main__":
    import sys
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
    # Test
    vi_path = "../dataset/dictionary/dict.vi"
    ba_path = "../dataset/dictionary/dict.ba"
    
    segmenter = Segmenter(vi_path, ba_path)
    test_sentence_vi = "Sáng ngày 23.7, Trung tâm giáo dục thường xuyên huyện Vĩnh Thạnh tổ chức Khai giảng lớp đào tạo nghề Trồng và nhân giống nấm"
    print("Test Sentence VI:", test_sentence_vi)
    res_vi = segmenter.segment(test_sentence_vi)
    for text, t_type in res_vi:
        print(f"[{t_type}] {text}")

    test_sentence_ba = "Rang 'năr 23.7 , Trung tâm 'yăo 'yŭk lah huên Vinh Thanh pơlŏk Khai giang jĕl đao tao nghê Pơtăm wơih kơtum adrêch mơu"
    print("\nTest Sentence BA:", test_sentence_ba)
    res_ba = segmenter.segment_bana(test_sentence_ba)
    for text, t_type in res_ba:
        print(f"[{t_type}] {text}")
