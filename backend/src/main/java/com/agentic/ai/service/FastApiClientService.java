package com.agentic.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FastApiClientService {

    private final WebClient fastApiWebClient;

    public Map<String, Object> profileDataset(String filePath, String name) {
        log.info("Calling FastAPI Profiler for: {}", filePath);
        return fastApiWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/profile")
                        .queryParam("file_path", filePath)
                        .queryParam("name", name)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> executeQuery(String filePath, String query, List<Map<String, String>> history) {
        log.info("Calling FastAPI Query Agent for query: {}", query);
        Map<String, Object> payload = Map.of(
                "file_path", filePath,
                "query", query,
                "chat_history", history != null ? history : List.of()
        );

        return fastApiWebClient.post()
                .uri("/api/v1/query")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> getCleaningRecommendations(String filePath) {
        log.info("Calling FastAPI Cleaning recommendations for: {}", filePath);
        return fastApiWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/cleaning/recommendations")
                        .queryParam("file_path", filePath)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> applyCleaning(String filePath, List<Map<String, Object>> steps, String outputName) {
        log.info("Calling FastAPI Apply Cleaning for: {}", filePath);
        Map<String, Object> payload = Map.of(
                "file_path", filePath,
                "steps", steps,
                "output_name", outputName != null ? outputName : ""
        );

        return fastApiWebClient.post()
                .uri("/api/v1/cleaning/apply")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> getEDA(String filePath, String name, String columns) {
        log.info("Calling FastAPI EDA for: {}", filePath);
        return fastApiWebClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/api/v1/eda")
                            .queryParam("file_path", filePath)
                            .queryParam("name", name);
                    if (columns != null && !columns.isBlank()) {
                        builder.queryParam("columns", columns);
                    }
                    return builder.build();
                })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> trainMLModel(Map<String, Object> request) {
        log.info("Calling FastAPI ML Train");
        return fastApiWebClient.post()
                .uri("/api/v1/ml/train")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> predictML(String modelId, Map<String, Object> inputData) {
        log.info("Calling FastAPI ML Predict for model: {}", modelId);
        Map<String, Object> payload = Map.of(
                "model_id", modelId,
                "input_data", inputData
        );

        return fastApiWebClient.post()
                .uri("/api/v1/ml/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> generateReport(String filePath, String datasetName, String customTitle, List<String> sections) {
        log.info("Calling FastAPI Report Generator for: {}", datasetName);
        Map<String, Object> payload = Map.of(
                "file_path", filePath,
                "dataset_name", datasetName,
                "custom_title", customTitle != null ? customTitle : "",
                "include_sections", sections != null ? sections : List.of("summary", "quality", "eda", "insights", "recommendations")
        );

        return fastApiWebClient.post()
                .uri("/api/v1/reports/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    public Map<String, Object> compareDatasets(String filePathA, String filePathB, String nameA, String nameB) {
        log.info("Calling FastAPI Dataset Compare: {} vs {}", nameA, nameB);
        Map<String, Object> payload = Map.of(
                "file_path_a", filePathA,
                "file_path_b", filePathB,
                "name_a", nameA,
                "name_b", nameB
        );

        return fastApiWebClient.post()
                .uri("/api/v1/compare")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }
}
