from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    sourceLang: str = Field(..., min_length=2, max_length=8)
    targetLang: str = Field(..., min_length=2, max_length=8)


class TranslateResponse(BaseModel):
    translatedText: str
    sourceLang: str
    targetLang: str


class ExampleItem(BaseModel):
    vi: str
    ethnic: str


class ExampleRequest(BaseModel):
    text: str
    sourceLang: str
    targetLang: str


class ExampleResponse(BaseModel):
    examples: list[ExampleItem]

