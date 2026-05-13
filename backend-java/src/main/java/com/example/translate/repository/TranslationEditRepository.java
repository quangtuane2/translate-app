package com.example.translate.repository;

import com.example.translate.entity.TranslationEdit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TranslationEditRepository extends JpaRepository<TranslationEdit, Long> {
}
