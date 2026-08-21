package com.agentic.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.List;

public class ReportDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenerateRequestDTO {
        @NotNull(message = "Dataset ID is required")
        private Long datasetId;

        private String customTitle;
        private List<String> includeSections;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportSummaryDTO {
        private Long id;
        private Long datasetId;
        private String title;
        private String executiveSummary;
        private Double qualityScore;
        private ZonedDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportDetailDTO {
        private Long id;
        private Long datasetId;
        private String title;
        private String executiveSummary;
        private Double qualityScore;
        private String markdownContent;
        private String htmlContent;
        private ZonedDateTime createdAt;
    }
}
