package com.example.translate.dto;

public class EditRequest {
    private Long historyId;
    private String suggestedTranslation;

    public Long getHistoryId() { return historyId; }
    public void setHistoryId(Long historyId) { this.historyId = historyId; }
    public String getSuggestedTranslation() { return suggestedTranslation; }
    public void setSuggestedTranslation(String suggestedTranslation) { this.suggestedTranslation = suggestedTranslation; }
}
