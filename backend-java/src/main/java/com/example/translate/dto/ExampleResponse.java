package com.example.translate.dto;

import java.util.List;

public class ExampleResponse {
    private List<ExampleItem> examples;

    public List<ExampleItem> getExamples() {
        return examples;
    }

    public void setExamples(List<ExampleItem> examples) {
        this.examples = examples;
    }
}
