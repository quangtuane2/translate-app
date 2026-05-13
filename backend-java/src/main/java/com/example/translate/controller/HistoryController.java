package com.example.translate.controller;

import com.example.translate.entity.TranslationHistory;
import com.example.translate.entity.User;
import com.example.translate.repository.TranslationHistoryRepository;
import com.example.translate.repository.UserRepository;
import com.example.translate.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private TranslationHistoryRepository historyRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUserHistory() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<TranslationHistory> historyList = historyRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getId());
        return ResponseEntity.ok(historyList);
    }

    @PostMapping
    public ResponseEntity<?> addHistory(@RequestBody TranslationHistory request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        Optional<TranslationHistory> existing = historyRepository.findFirstByUserIdAndSourceLangAndTargetLangAndOriginalTextAndTranslatedText(
                user.getId(), request.getSourceLang(), request.getTargetLang(), request.getOriginalText(), request.getTranslatedText()
        );
        
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        request.setUser(user);
        TranslationHistory saved = historyRepository.save(request);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        TranslationHistory history = historyRepository.findById(id).orElse(null);
        if (history != null && history.getUser().getId().equals(userDetails.getId())) {
            historyRepository.delete(history);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().body("History not found or unauthorized");
    }
}
