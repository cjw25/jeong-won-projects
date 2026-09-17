package com.plandoseediary.domain;

public enum Priority {

    HIGH("높음"),
    MEDIUM("보통"),
    LOW("낮음");

    private final String label;

    Priority(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}