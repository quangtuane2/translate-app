package com.example.translate.controller;

import com.example.translate.dto.TranslateRequest;
import com.example.translate.dto.TranslateResponse;
import com.example.translate.dto.ExampleRequest;
import com.example.translate.dto.ExampleResponse;
import com.example.translate.service.TranslateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

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
}

