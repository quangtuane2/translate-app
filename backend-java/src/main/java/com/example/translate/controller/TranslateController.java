package com.example.translate.controller;

import com.example.translate.dto.TranslateRequest;
import com.example.translate.dto.TranslateResponse;
import com.example.translate.dto.ExampleRequest;
import com.example.translate.dto.ExampleResponse;
import com.example.translate.dto.TtsRequest;
import com.example.translate.dto.TtsResponse;
import com.example.translate.service.TranslateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TranslateController {

    private final TranslateService translateService;

    public TranslateController(TranslateService translateService) {
        this.translateService = translateService;
    }

    @PostMapping("/translate")
    public ResponseEntity<TranslateResponse> translate(@Valid @RequestBody TranslateRequest req) {
        TranslateResponse resp = translateService.translate(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/examples")
    public ResponseEntity<ExampleResponse> getExamples(@Valid @RequestBody ExampleRequest req) {
        ExampleResponse resp = translateService.getExamples(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/tts")
    public ResponseEntity<TtsResponse> getTts(@Valid @RequestBody TtsRequest req) {
        TtsResponse resp = translateService.getTts(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping(value = "/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.example.translate.dto.OcrResponse> processOcr(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @org.springframework.web.bind.annotation.RequestParam("sourceLang") String sourceLang,
            @org.springframework.web.bind.annotation.RequestParam("targetLang") String targetLang) {
        com.example.translate.dto.OcrResponse resp = translateService.processOcr(file, sourceLang, targetLang);
        return ResponseEntity.ok(resp);
    }

    @PostMapping(value = "/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.example.translate.dto.DocumentResponse> processDocument(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @org.springframework.web.bind.annotation.RequestParam("sourceLang") String sourceLang,
            @org.springframework.web.bind.annotation.RequestParam("targetLang") String targetLang) {
        com.example.translate.dto.DocumentResponse resp = translateService.processDocument(file, sourceLang,
                targetLang);
        return ResponseEntity.ok(resp);
    }
}
