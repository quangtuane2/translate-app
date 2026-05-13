package com.example.translate.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "translation_edits")
public class TranslationEdit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "history_id", nullable = false)
    private TranslationHistory history;

    @Column(name = "suggested_translation", nullable = false, columnDefinition = "TEXT")
    private String suggestedTranslation;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public TranslationEdit() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public TranslationHistory getHistory() { return history; }
    public void setHistory(TranslationHistory history) { this.history = history; }
    public String getSuggestedTranslation() { return suggestedTranslation; }
    public void setSuggestedTranslation(String suggestedTranslation) { this.suggestedTranslation = suggestedTranslation; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
