package com.example.translate.controller;

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

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private TranslationHistoryRepository historyRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUserFavorites() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Favorite> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getId());
        return ResponseEntity.ok(favorites);
    }

    @PostMapping
    public ResponseEntity<?> toggleFavorite(@RequestBody Map<String, Long> payload) {
        Long historyId = payload.get("historyId");
        if (historyId == null) return ResponseEntity.badRequest().body("historyId is required");

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        TranslationHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("History not found"));

        // Check if already favorited
        List<Favorite> userFavs = favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        Favorite existing = userFavs.stream().filter(f -> f.getHistory().getId().equals(historyId)).findFirst().orElse(null);

        if (existing != null) {
            favoriteRepository.delete(existing);
            return ResponseEntity.ok().body(Map.of("status", "removed"));
        } else {
            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setHistory(history);
            favoriteRepository.save(favorite);
            return ResponseEntity.ok().body(Map.of("status", "added"));
        }
    }
}
