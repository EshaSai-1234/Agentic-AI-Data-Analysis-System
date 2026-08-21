package com.agentic.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;
import java.util.Map;

public class MLDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrainRequestDTO {
        @NotNull(message = "Dataset ID is required")
        private Long datasetId;

        @NotNull(message = "Target column is required")
        private String targetColumn;

        private String taskType; // auto, classification, regression, clustering, anomaly_detection
        private List<String> featureColumns;
        private String modelAlgorithm; // auto, random_forest, linear_regression, logistic_regression, etc.
        private Double testSize;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PredictRequestDTO {
        @NotNull(message = "Model UUID is required")
        private String modelId;

        @NotNull(message = "Input data dictionary is required")
        private Map<String, Object> inputData;
    }
}
