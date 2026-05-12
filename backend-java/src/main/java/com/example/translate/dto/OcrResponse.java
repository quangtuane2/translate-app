package com.example.translate.dto;

import java.util.List;

public class OcrResponse {
    private List<OcrBlock> blocks;

    public List<OcrBlock> getBlocks() {
        return blocks;
    }

    public void setBlocks(List<OcrBlock> blocks) {
        this.blocks = blocks;
    }
}
