import io
from docx import Document as DocxDocument
import fitz  # PyMuPDF
from app.inference.translator import translate

def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode('utf-8', errors='replace')

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(io.BytesIO(file_bytes))
    return '\n'.join([para.text for para in doc.paragraphs])

def extract_text_from_pdf(file_bytes: bytes) -> str:
    pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in pdf_document:
        text += page.get_text()
    return text

def process_document(file_bytes: bytes, filename: str, source_lang: str, target_lang: str) -> dict:
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    original_text = ""
    if ext == 'txt':
        original_text = extract_text_from_txt(file_bytes)
    elif ext == 'docx':
        original_text = extract_text_from_docx(file_bytes)
    elif ext == 'pdf':
        original_text = extract_text_from_pdf(file_bytes)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
    
    # We might need to chunk the text if it's too long for the translation model
    # For simplicity, let's translate the whole text or split by paragraphs/lines
    # If the translation model can handle large inputs, we can just call translate
    # However, to be safe, let's split by double newline or chunks of 2000 chars.
    
    paragraphs = original_text.split('\n')
    translated_paragraphs = []
    
    # Batching to avoid too many requests or too large payloads, depending on translator
    current_chunk = []
    current_length = 0
    
    for p in paragraphs:
        if not p.strip():
            translated_paragraphs.append("")
            continue
            
        if current_length + len(p) > 2000:
            if current_chunk:
                chunk_text = '\n'.join(current_chunk)
                t_text = translate(text=chunk_text, source_lang=source_lang, target_lang=target_lang)
                translated_paragraphs.extend(t_text.split('\n'))
                current_chunk = []
                current_length = 0
                
        current_chunk.append(p)
        current_length += len(p)
        
    if current_chunk:
        chunk_text = '\n'.join(current_chunk)
        t_text = translate(text=chunk_text, source_lang=source_lang, target_lang=target_lang)
        translated_paragraphs.extend(t_text.split('\n'))
        
    translated_text = '\n'.join(translated_paragraphs)
    
    return {
        "originalText": original_text,
        "translatedText": translated_text
    }
