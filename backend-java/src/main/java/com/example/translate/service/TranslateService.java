package com.example.translate.service;

import com.example.translate.dto.TranslateRequest;
import com.example.translate.dto.TranslateResponse;
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
}

