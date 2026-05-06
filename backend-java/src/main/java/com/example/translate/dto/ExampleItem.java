package com.example.translate.dto;

public class ExampleItem {
    private String vi;
    private String ethnic;

    public ExampleItem() {}

    public ExampleItem(String vi, String ethnic) {
        this.vi = vi;
        this.ethnic = ethnic;
    }

    public String getVi() {
        return vi;
    }

    public void setVi(String vi) {
        this.vi = vi;
    }

    public String getEthnic() {
        return ethnic;
    }

    public void setEthnic(String ethnic) {
        this.ethnic = ethnic;
    }
}
