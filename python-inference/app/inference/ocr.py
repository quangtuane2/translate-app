import pytesseract
from pytesseract import Output
from PIL import Image
from io import BytesIO
import os
from app.inference.translator import translate

# Explicitly set the tesseract path for Windows
tesseract_cmd_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(tesseract_cmd_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd_path

def process_image(image_bytes: bytes, source_lang: str, target_lang: str) -> list[dict]:
    # Ensure Tesseract can find its executable if needed (on Windows, often required if not in PATH properly)
    # But user said they added it to PATH, so we'll just try using it directly first.
    
    # Map source_lang to tesseract lang
    # Ba Na ('bna') and Ede ('ede') use Latin script with diacritics similar to Vietnamese, so 'vie' is best.
    # Khmer ('km') requires the 'khm' tesseract language pack installed.
    if source_lang in ['vi', 'bna', 'ede']:
        tess_lang = 'vie'
    elif source_lang == 'km':
        tess_lang = 'khm'
    else:
        tess_lang = 'eng'
    
    image = Image.open(BytesIO(image_bytes))
    
    # Perform OCR with bounding boxes
    data = pytesseract.image_to_data(image, lang=tess_lang, output_type=Output.DICT)
    
    n_boxes = len(data['level'])
    lines = {}
    
    for i in range(n_boxes):
        text = data['text'][i].strip()
        if text:
            block_num = data['block_num'][i]
            par_num = data['par_num'][i]
            line_num = data['line_num'][i]
            
            key = (block_num, par_num, line_num)
            
            if key not in lines:
                lines[key] = {
                    'text': [],
                    'x': data['left'][i],
                    'y': data['top'][i],
                    'right': data['left'][i] + data['width'][i],
                    'bottom': data['top'][i] + data['height'][i]
                }
            else:
                lines[key]['text'].append(text)
                lines[key]['right'] = max(lines[key]['right'], data['left'][i] + data['width'][i])
                lines[key]['bottom'] = max(lines[key]['bottom'], data['top'][i] + data['height'][i])
                lines[key]['x'] = min(lines[key]['x'], data['left'][i])
                lines[key]['y'] = min(lines[key]['y'], data['top'][i])
                
    results = []
    for key, line in lines.items():
        original_text = ' '.join(line['text']).strip()
        if not original_text:
            continue
            
        # Translate the text
        try:
            translated_text = translate(original_text, source_lang, target_lang)
        except Exception as e:
            print(f"Translation error: {e}")
            translated_text = original_text # fallback
            
        results.append({
            'originalText': original_text,
            'translatedText': translated_text,
            'x': line['x'],
            'y': line['y'],
            'width': line['right'] - line['x'],
            'height': line['bottom'] - line['y']
        })
        
    return results
