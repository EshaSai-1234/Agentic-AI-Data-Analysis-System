package com.agentic.ai.service;

import com.agentic.ai.dto.AnalysisDTO;
import com.agentic.ai.entity.CleanedDataset;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.User;
import com.agentic.ai.repository.CleanedDatasetRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final DatasetService datasetService;
    private final FastApiClientService fastApiClientService;
    private final CleanedDatasetRepository cleanedDatasetRepository;
    private final AuthService authService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> getEDA(Long datasetId, String columns) {
        Dataset dataset = datasetService.getDatasetEntity(datasetId);
        return fastApiClientService.getEDA(dataset.getFilePath(), dataset.getName(), columns);
    }

    public Map<String, Object> getCleaningRecommendations(Long datasetId) {
        Dataset dataset = datasetService.getDatasetEntity(datasetId);
        return fastApiClientService.getCleaningRecommendations(dataset.getFilePath());
    }

    @Transactional
    public Map<String, Object> applyCleaning(AnalysisDTO.ApplyCleaningRequestDTO request) {
        User user = authService.getCurrentUser();
        Dataset dataset = datasetService.getDatasetEntity(request.getDatasetId());

        List<Map<String, Object>> steps = request.getSteps().stream()
                .map(s -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("action", s.getAction());
                    if (s.getColumn() != null) map.put("column", s.getColumn());
                    if (s.getStrategy() != null) map.put("strategy", s.getStrategy());
                    if (s.getFillValue() != null) map.put("fill_value", s.getFillValue());
                    if (s.getTargetType() != null) map.put("target_type", s.getTargetType());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = fastApiClientService.applyCleaning(
                dataset.getFilePath(),
                steps,
                request.getOutputName()
        );

        // Record in CleanedDataset entity
        try {
            String cleanedPath = (String) response.get("cleaned_file_path");
            Number newRows = (Number) response.get("new_row_count");
            Number newCols = (Number) response.get("new_column_count");
            Number scoreBefore = (Number) response.get("quality_score_before");
            Number scoreAfter = (Number) response.get("quality_score_after");

            CleanedDataset record = CleanedDataset.builder()
                    .originalDataset(dataset)
                    .user(user)
                    .name((request.getOutputName() != null && !request.getOutputName().isBlank()) ? request.getOutputName() : "Cleaned - " + dataset.getName())
                    .filePath(cleanedPath)
                    .rowCount(newRows != null ? newRows.intValue() : 0)
                    .columnCount(newCols != null ? newCols.intValue() : 0)
                    .qualityScoreBefore(scoreBefore != null ? scoreBefore.doubleValue() : 0.0)
                    .qualityScoreAfter(scoreAfter != null ? scoreAfter.doubleValue() : 0.0)
                    .recipeJson(objectMapper.writeValueAsString(steps))
                    .build();

            cleanedDatasetRepository.save(record);
        } catch (Exception e) {
            log.warn("Could not persist CleanedDataset entity: {}", e.getMessage());
        }

        return response;
    }

    public Map<String, Object> compareDatasets(Long datasetIdA, Long datasetIdB) {
        Dataset datasetA = datasetService.getDatasetEntity(datasetIdA);
        Dataset datasetB = datasetService.getDatasetEntity(datasetIdB);

        return fastApiClientService.compareDatasets(
                datasetA.getFilePath(),
                datasetB.getFilePath(),
                datasetA.getName(),
                datasetB.getName()
        );
    }
}
