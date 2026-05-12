from fastapi import FastAPI, HTTPException
from app.inference.translator import translate
from app.inference.examples import example_extractor
from app.models.schemas import TranslateRequest, TranslateResponse, ExampleRequest, ExampleResponse, TtsRequest, TtsResponse
from app.inference.tts_phonetics import convert_to_vietnamese_phonetics
from gtts import gTTS
import base64
from io import BytesIO


app = FastAPI(title="Inference Service", version="1.0.0")


@app.post("/internal/translate", response_model=TranslateResponse)
def internal_translate(req: TranslateRequest) -> TranslateResponse:
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text must not be empty.")

    translated_text = translate(text=text, source_lang=req.sourceLang, target_lang=req.targetLang)
    return TranslateResponse(
        translatedText=translated_text,
        sourceLang=req.sourceLang,
        targetLang=req.targetLang,
    )


@app.post("/internal/examples", response_model=ExampleResponse)
def internal_examples(req: ExampleRequest) -> ExampleResponse:
    examples = example_extractor.get_examples(
        query=req.text,
        source_lang=req.sourceLang,
        target_lang=req.targetLang
    )
    return ExampleResponse(examples=examples)

@app.post("/internal/tts", response_model=TtsResponse)
def internal_tts(req: TtsRequest) -> TtsResponse:
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text must not be empty.")
    try:
        tts_text = convert_to_vietnamese_phonetics(text, req.lang)
        tts_lang = "vi" if req.lang in ["bana", "ede"] else req.lang
        tts = gTTS(text=tts_text, lang=tts_lang)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_base64 = base64.b64encode(fp.read()).decode("utf-8")
        return TtsResponse(audioBase64=audio_base64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import File, UploadFile, Form
from app.inference.ocr import process_image
from app.models.schemas import OcrResponse, DocumentResponse
from app.inference.document import process_document

@app.post("/internal/ocr", response_model=OcrResponse)
async def internal_ocr(
    file: UploadFile = File(...),
    sourceLang: str = Form(...),
    targetLang: str = Form(...)
) -> OcrResponse:
    try:
        image_bytes = await file.read()
        blocks = process_image(image_bytes, sourceLang, targetLang)
        return OcrResponse(blocks=blocks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.post("/internal/document", response_model=DocumentResponse)
async def internal_document(
    file: UploadFile = File(...),
    sourceLang: str = Form(...),
    targetLang: str = Form(...)
) -> DocumentResponse:
    try:
        file_bytes = await file.read()
        filename = file.filename or ""
        result = process_document(file_bytes, filename, sourceLang, targetLang)
        return DocumentResponse(
            originalText=result["originalText"],
            translatedText=result["translatedText"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

