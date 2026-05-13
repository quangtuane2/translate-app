package com.example.translate.dto;

import java.util.List;

public class SyncRequest {
    private List<HistoryItem> history;
    private List<FavoriteItem> favorites;

    public List<HistoryItem> getHistory() { return history; }
    public void setHistory(List<HistoryItem> history) { this.history = history; }
    public List<FavoriteItem> getFavorites() { return favorites; }
    public void setFavorites(List<FavoriteItem> favorites) { this.favorites = favorites; }

    public static class HistoryItem {
        private String sourceText;
        private String targetText;
        private String sourceLang;
        private String targetLang;

        public String getSourceText() { return sourceText; }
        public void setSourceText(String sourceText) { this.sourceText = sourceText; }
        public String getTargetText() { return targetText; }
        public void setTargetText(String targetText) { this.targetText = targetText; }
        public String getSourceLang() { return sourceLang; }
        public void setSourceLang(String sourceLang) { this.sourceLang = sourceLang; }
        public String getTargetLang() { return targetLang; }
        public void setTargetLang(String targetLang) { this.targetLang = targetLang; }
    }

    public static class FavoriteItem {
        private String sourceText;
        private String targetText;
        private String sourceLang;
        private String targetLang;

        public String getSourceText() { return sourceText; }
        public void setSourceText(String sourceText) { this.sourceText = sourceText; }
        public String getTargetText() { return targetText; }
        public void setTargetText(String targetText) { this.targetText = targetText; }
        public String getSourceLang() { return sourceLang; }
        public void setSourceLang(String sourceLang) { this.sourceLang = sourceLang; }
        public String getTargetLang() { return targetLang; }
        public void setTargetLang(String targetLang) { this.targetLang = targetLang; }
    }
}
