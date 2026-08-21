package com.agentic.ai.dto;

import lombok.*;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

public class DatasetDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DatasetSummary {
        private Long id;
        private String name;
        private String originalFilename;
        private String fileFormat;
        private Long fileSizeBytes;
        private Integer rowCount;
        private Integer columnCount;
        private Double qualityScore;
        private String qualityGrade;
        private String description;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ColumnSummary {
        private Long id;
        private String columnName;
        private String dataType;
        private String inferredType;
        private Integer nullCount;
        private Double nullPercentage;
        private Integer distinctCount;
        private Boolean isPrimaryKeyCandidate;
        private String minValue;
        private String maxValue;
        private Double meanVal;
        private Double medianVal;
        private Double stdDev;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DatasetDetail {
        private DatasetSummary summary;
        private List<ColumnSummary> columns;
        private List<Map<String, Object>> previewData;
        private Object qualityBreakdown;
        private List<Object> recommendedVisualizations;
    }
}
