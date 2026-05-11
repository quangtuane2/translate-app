def convert_to_vietnamese_phonetics(text: str, lang: str) -> str:
    """
    Chuyển đổi văn bản tiếng Ba Na hoặc Ê-đê sang cách viết phát âm gần giống trong tiếng Việt
    để dùng với gTTS (Google Text-to-Speech) phiên bản tiếng Việt.
    """
    if lang not in ["bana", "ede"]:
        return text
        
    # Chuyển về chữ thường để dễ replace, hoặc giữ nguyên case nhưng viết dict bao gồm cả hoa/thường
    # Tạm thời thay thế các ký tự đặc biệt phổ biến sang ký tự tiếng Việt tương ứng
    replacements = {
        # Ê-đê
        "č": "ch", "Č": "Ch",
        "ñ": "nh", "Ñ": "Nh",
        "ƀ": "b", "Ƀ": "B",
        "ĭ": "i", "Ĭ": "I",
        "ŭ": "u", "Ŭ": "U",
        "ŏ": "o", "Ŏ": "O",
        "ɇ": "e", "Ɇ": "E",
        "k̆": "k", "K̆": "K",
        "m̆": "m", "M̆": "M",
        "n̆": "n", "N̆": "N",
        "p̆": "p", "P̆": "P",
        "t̆": "t", "T̆": "T",
        "y̆": "y", "Y̆": "Y",
        # Ba Na (Thêm các ký tự đặc thù nếu có)
        "ơ̆": "ơ", "Ơ̆": "Ơ",
        "ư̆": "ư", "Ư̆": "Ư",
        "â̆": "â", "Â̆": "Â",
        "ê̆": "ê", "Ê̆": "Ê",
        "ô̆": "ô", "Ô̆": "Ô",
        "ă": "a", "Ă": "A", # ă trong tiếng việt có nhưng tts đôi khi đọc sai nếu đứng một mình, tạm giữ nguyên hoặc đổi
    }
    
    result = text
    for old, new in replacements.items():
        result = result.replace(old, new)
        
    return result
