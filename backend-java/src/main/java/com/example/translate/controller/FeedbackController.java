package com.example.translate.controller;

import com.example.translate.dto.EditRequest;
import com.example.translate.dto.VoteRequest;
import com.example.translate.dto.auth.MessageResponse;
import com.example.translate.entity.TranslationEdit;
import com.example.translate.entity.TranslationHistory;
import com.example.translate.entity.TranslationVote;
import com.example.translate.entity.User;
import com.example.translate.entity.VoteType;
import com.example.translate.repository.TranslationEditRepository;
import com.example.translate.repository.TranslationHistoryRepository;
import com.example.translate.repository.TranslationVoteRepository;
import com.example.translate.repository.UserRepository;
import com.example.translate.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private TranslationEditRepository editRepository;

    @Autowired
    private TranslationVoteRepository voteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TranslationHistoryRepository historyRepository;

    @PostMapping("/edit")
    public ResponseEntity<?> submitEdit(@RequestBody EditRequest editRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        TranslationHistory history = historyRepository.findById(editRequest.getHistoryId())
                .orElseThrow(() -> new RuntimeException("Error: History not found."));

        TranslationEdit edit = new TranslationEdit();
        edit.setUser(user);
        edit.setHistory(history);
        edit.setSuggestedTranslation(editRequest.getSuggestedTranslation());

        editRepository.save(edit);

        return ResponseEntity.ok(new MessageResponse("Translation edit submitted successfully!"));
    }

    @PostMapping("/vote")
    public ResponseEntity<?> submitVote(@RequestBody VoteRequest voteRequest) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        TranslationHistory history = historyRepository.findById(voteRequest.getHistoryId())
                .orElseThrow(() -> new RuntimeException("Error: History not found."));

        Optional<TranslationVote> existingVote = voteRepository.findByUserIdAndHistoryId(
                user.getId(), voteRequest.getHistoryId());

        if (existingVote.isPresent()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Bạn đã đánh giá (vote) cho câu dịch này rồi!"));
        }

        TranslationVote vote = new TranslationVote();
        vote.setUser(user);
        vote.setHistory(history);

        try {
            vote.setVoteType(VoteType.valueOf(voteRequest.getVoteType().toUpperCase()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid vote type."));
        }

        voteRepository.save(vote);

        return ResponseEntity.ok(new MessageResponse("Vote submitted successfully!"));
    }
}
