package com.example.translate.exception;

public class UpstreamServiceException extends RuntimeException {
    private final int statusCode;

    public UpstreamServiceException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}

