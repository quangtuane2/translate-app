from fastapi import FastAPI, HTTPException
from app.inference.translator import translate
from app.inference.examples import example_extractor
from app.models.schemas import TranslateRequest, TranslateResponse, ExampleRequest, ExampleResponse


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

