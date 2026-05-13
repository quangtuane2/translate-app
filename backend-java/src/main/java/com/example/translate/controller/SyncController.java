package com.example.translate.controller;

import com.example.translate.dto.SyncRequest;
import com.example.translate.dto.auth.MessageResponse;
import com.example.translate.entity.Favorite;
import com.example.translate.entity.TranslationHistory;
import com.example.translate.entity.User;
import com.example.translate.repository.FavoriteRepository;
import com.example.translate.repository.TranslationHistoryRepository;
import com.example.translate.repository.UserRepository;
import com.example.translate.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class SyncController {

    @Autowired
    private TranslationHistoryRepository historyRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/sync-guest-data")
    public ResponseEntity<?> syncGuestData(@RequestBody SyncRequest syncRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        // Use a map to keep track of saved history items so we can link favorites
        Map<String, TranslationHistory> savedHistoryMap = new HashMap<>();

        // Sync History
        if (syncRequest.getHistory() != null) {
            for (SyncRequest.HistoryItem item : syncRequest.getHistory()) {
                String sourceLang = item.getSourceLang() != null ? item.getSourceLang() : "auto";
                
                Optional<TranslationHistory> existing = historyRepository.findFirstByUserIdAndSourceLangAndTargetLangAndOriginalTextAndTranslatedText(
                        user.getId(), sourceLang, item.getTargetLang(), item.getSourceText(), item.getTargetText()
                );
                
                TranslationHistory savedHistory;
                if (existing.isPresent()) {
                    savedHistory = existing.get();
                } else {
                    TranslationHistory history = new TranslationHistory();
                    history.setUser(user);
                    history.setSourceLang(sourceLang);
                    history.setTargetLang(item.getTargetLang());
                    history.setOriginalText(item.getSourceText());
                    history.setTranslatedText(item.getTargetText());
                    
                    savedHistory = historyRepository.save(history);
                }
                
                // Create a unique key based on text to match favorites later
                String key = item.getSourceText() + "|||" + item.getTargetText();
                savedHistoryMap.put(key, savedHistory);
            }
        }

        // Sync Favorites
        if (syncRequest.getFavorites() != null) {
            for (SyncRequest.FavoriteItem item : syncRequest.getFavorites()) {
                String key = item.getSourceText() + "|||" + item.getTargetText();
                TranslationHistory relatedHistory = savedHistoryMap.get(key);
                
                // If a favorite doesn't have a matching history in the current payload,
                // we should create a history record for it first because favorites REQUIRE a history_id
                if (relatedHistory == null) {
                    String sourceLang = item.getSourceLang() != null ? item.getSourceLang() : "auto";
                    Optional<TranslationHistory> existing = historyRepository.findFirstByUserIdAndSourceLangAndTargetLangAndOriginalTextAndTranslatedText(
                            user.getId(), sourceLang, item.getTargetLang(), item.getSourceText(), item.getTargetText()
                    );
                    
                    if (existing.isPresent()) {
                        relatedHistory = existing.get();
                    } else {
                        TranslationHistory history = new TranslationHistory();
                        history.setUser(user);
                        history.setSourceLang(sourceLang);
                        history.setTargetLang(item.getTargetLang());
                        history.setOriginalText(item.getSourceText());
                        history.setTranslatedText(item.getTargetText());
                        relatedHistory = historyRepository.save(history);
                    }
                    savedHistoryMap.put(key, relatedHistory);
                }

                Favorite favorite = new Favorite();
                favorite.setUser(user);
                favorite.setHistory(relatedHistory);
                favoriteRepository.save(favorite);
            }
        }

        return ResponseEntity.ok(new MessageResponse("Data synchronized successfully!"));
    }
}
