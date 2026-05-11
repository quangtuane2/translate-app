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

