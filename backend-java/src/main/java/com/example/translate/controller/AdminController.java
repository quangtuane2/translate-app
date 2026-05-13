package com.example.translate.controller;

import com.example.translate.entity.TranslationEdit;
import com.example.translate.entity.TranslationVote;
import com.example.translate.repository.TranslationEditRepository;
import com.example.translate.repository.TranslationHistoryRepository;
import com.example.translate.repository.TranslationVoteRepository;
import com.example.translate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TranslationHistoryRepository historyRepository;

    @Autowired
    private TranslationVoteRepository voteRepository;

    @Autowired
    private TranslationEditRepository editRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalUsers = userRepository.count();
        long totalTranslations = historyRepository.count();
        long totalVotes = voteRepository.count();
        long totalEdits = editRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalTranslations", totalTranslations);
        stats.put("totalVotes", totalVotes);
        stats.put("totalEdits", totalEdits);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-feedback")
    public ResponseEntity<?> getRecentFeedback() {
        List<TranslationVote> recentVotes = voteRepository.findTop10ByOrderByCreatedAtDesc();
        List<TranslationEdit> recentEdits = editRepository.findTop10ByOrderByCreatedAtDesc();

        Map<String, Object> feedback = new HashMap<>();
        feedback.put("recentVotes", recentVotes);
        feedback.put("recentEdits", recentEdits);

        return ResponseEntity.ok(feedback);
    }
}
