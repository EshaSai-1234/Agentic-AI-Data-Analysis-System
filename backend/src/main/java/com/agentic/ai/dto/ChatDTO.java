package com.agentic.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

public class ChatDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatQueryRequest {
        @NotNull(message = "Dataset ID is required")
        private Long datasetId;

        private Long chatSessionId;

        @NotBlank(message = "Query text is required")
        private String query;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatMessageDTO {
        private Long id;
        private Long chatSessionId;
        private String sender; // USER or ASSISTANT
        private String queryText;
        private String explanation;
        private String intent;
        private String chartType;
        private Object chartConfig;
        private Object stats;
        private String safeCodeSnippet;
        private Double executionTimeMs;
        private String limitations;
        private List<String> suggestedFollowups;
        private List<Map<String, Object>> resultData;
        private ZonedDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatSessionDTO {
        private Long id;
        private Long datasetId;
        private String sessionTitle;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
        private List<ChatMessageDTO> messages;
    }
}
