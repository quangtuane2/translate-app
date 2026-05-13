package com.example.translate.repository;

import com.example.translate.entity.TranslationVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TranslationVoteRepository extends JpaRepository<TranslationVote, Long> {
    Optional<TranslationVote> findByUserIdAndHistoryId(Long userId, Long historyId);
}
