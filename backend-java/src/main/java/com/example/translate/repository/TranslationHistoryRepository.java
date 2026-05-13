package com.example.translate.repository;

import com.example.translate.entity.TranslationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TranslationHistoryRepository extends JpaRepository<TranslationHistory, Long> {
    List<TranslationHistory> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Long userId);

    Optional<TranslationHistory> findFirstByUserIdAndSourceLangAndTargetLangAndOriginalTextAndTranslatedTextAndIsDeletedFalse(
        Long userId, String sourceLang, String targetLang, String originalText, String translatedText
    );
}
