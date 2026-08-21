package com.agentic.ai.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

public class AnalysisDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CleaningStepDTO {
        private String action;
        private String column;
        private String strategy;
        private Object fillValue;
        private String targetType;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApplyCleaningRequestDTO {
        private Long datasetId;
        private List<CleaningStepDTO> steps;
        private String outputName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompareRequestDTO {
        private Long datasetIdA;
        private Long datasetIdB;
    }
}
