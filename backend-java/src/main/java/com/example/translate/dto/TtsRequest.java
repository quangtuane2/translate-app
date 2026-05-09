package com.example.translate.dto;

import jakarta.validation.constraints.NotBlank;

public class TtsRequest {
    @NotBlank(message = "Text cannot be blank")
    private String text;

    private String lang = "vi";

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }
}
