package com.example.translate.service;

import com.example.translate.dto.TranslateRequest;
import com.example.translate.dto.TranslateResponse;
import com.example.translate.dto.ExampleRequest;
import com.example.translate.dto.ExampleResponse;
import com.example.translate.dto.TtsRequest;
import com.example.translate.dto.TtsResponse;
import com.example.translate.exception.UpstreamServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class TranslateService {

    private final RestTemplate restTemplate;

    @Value("${python.baseUrl:http://localhost:8001}")
    private String pythonBaseUrl;

    public TranslateService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public TranslateResponse translate(TranslateRequest req) {
        String url = pythonBaseUrl + "/internal/translate";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<TranslateRequest> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<TranslateResponse> resp = restTemplate.postForEntity(url, entity, TranslateResponse.class);
            return resp.getBody();
        } catch (HttpStatusCodeException ex) {
            // Forward python error code/message to UI.
            String body = ex.getResponseBodyAsString();
            int status = ex.getStatusCode().value();
            if (body == null || body.isBlank()) {
                throw new UpstreamServiceException("Python service error", status);
            }
            throw new UpstreamServiceException(body, status);
        } catch (RestClientException ex) {
            throw new UpstreamServiceException("Python service unavailable", 502);
        }
    }

    public ExampleResponse getExamples(ExampleRequest req) {
        String url = pythonBaseUrl + "/internal/examples";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<ExampleRequest> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<ExampleResponse> resp = restTemplate.postForEntity(url, entity, ExampleResponse.class);
            return resp.getBody();
        } catch (HttpStatusCodeException ex) {
            String body = ex.getResponseBodyAsString();
            int status = ex.getStatusCode().value();
            throw new UpstreamServiceException(body != null ? body : "Python service error", status);
        } catch (RestClientException ex) {
            throw new UpstreamServiceException("Python service unavailable", 502);
        }
    }

    public TtsResponse getTts(TtsRequest req) {
        String url = pythonBaseUrl + "/internal/tts";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<TtsRequest> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<TtsResponse> resp = restTemplate.postForEntity(url, entity, TtsResponse.class);
            return resp.getBody();
        } catch (HttpStatusCodeException ex) {
            String body = ex.getResponseBodyAsString();
            int status = ex.getStatusCode().value();
            throw new UpstreamServiceException(body != null ? body : "Python service error", status);
        } catch (RestClientException ex) {
            throw new UpstreamServiceException("Python service unavailable", 502);
        }
    }

    public com.example.translate.dto.OcrResponse processOcr(org.springframework.web.multipart.MultipartFile file, String sourceLang, String targetLang) {
        String url = pythonBaseUrl + "/internal/ocr";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
        try {
            org.springframework.core.io.ByteArrayResource fileAsResource = new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("file", fileAsResource);
            body.add("sourceLang", sourceLang);
            body.add("targetLang", targetLang);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error reading file", e);
        }

        HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<com.example.translate.dto.OcrResponse> response = restTemplate.postForEntity(url, requestEntity, com.example.translate.dto.OcrResponse.class);
            return response.getBody();
        } catch (HttpStatusCodeException ex) {
            String respBody = ex.getResponseBodyAsString();
            int status = ex.getStatusCode().value();
            throw new UpstreamServiceException(respBody != null ? respBody : "Python service error", status);
        } catch (RestClientException ex) {
            throw new UpstreamServiceException("Python service unavailable", 502);
        }
    }
}

