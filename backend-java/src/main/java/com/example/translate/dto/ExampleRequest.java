package com.example.translate.dto;

import jakarta.validation.constraints.NotBlank;
public class ExampleRequest {
    @NotBlank
    private String text;

    @NotBlank
    private String sourceLang;

    @NotBlank
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
