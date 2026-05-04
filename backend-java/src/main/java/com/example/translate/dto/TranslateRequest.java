package com.example.translate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TranslateRequest {

    @NotBlank(message = "Text must not be empty.")
    @Size(max = 5000)
    private String text;

    @NotBlank(message = "sourceLang is required.")
    @Size(min = 2, max = 8)
    private String sourceLang;

    @NotBlank(message = "targetLang is required.")
    @Size(min = 2, max = 8)
    private String targetLang;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getSourceLang() {
        return sourceLang;
    }

    public void setSourceLang(String sourceLang) {
        this.sourceLang = sourceLang;
    }

    public String getTargetLang() {
        return targetLang;
    }

    public void setTargetLang(String targetLang) {
        this.targetLang = targetLang;
    }
}

