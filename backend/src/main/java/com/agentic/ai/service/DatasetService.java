package com.agentic.ai.service;

import com.agentic.ai.dto.DatasetDTO;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.DatasetColumn;
import com.agentic.ai.entity.User;
import com.agentic.ai.exception.ResourceNotFoundException;
import com.agentic.ai.repository.DatasetColumnRepository;
import com.agentic.ai.repository.DatasetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatasetService {

    private final DatasetRepository datasetRepository;
    private final DatasetColumnRepository datasetColumnRepository;
    private final StorageService storageService;
    private final FastApiClientService fastApiClientService;
    private final AuthService authService;

    @Transactional
    public DatasetDTO.DatasetDetail uploadDataset(MultipartFile file, String name, String description) {
        User user = authService.getCurrentUser();
        String storedPath = storageService.storeFile(file);
        String originalFilename = file.getOriginalFilename();
        String format = storageService.getExtension(originalFilename).toUpperCase();
        long size = file.getSize();

        String datasetName = (name != null && !name.isBlank()) ? name : originalFilename;

        Dataset dataset = Dataset.builder()
                .user(user)
                .name(datasetName)
                .originalFilename(originalFilename)
                .filePath(storedPath)
                .fileFormat(format)
                .fileSizeBytes(size)
                .description(description)
                .build();

        dataset = datasetRepository.save(dataset);

        // Fetch initial profile from Python AI Service
        try {
            Map<String, Object> profile = fastApiClientService.profileDataset(storedPath, datasetName);
            updateDatasetFromProfile(dataset, profile);
            dataset = datasetRepository.save(dataset);
            return getDatasetDetail(dataset.getId());
        } catch (Exception e) {
            log.warn("FastAPI profiling call deferred: {}", e.getMessage());
            return getDatasetDetail(dataset.getId());
        }
    }

    @Transactional
    public void updateDatasetFromProfile(Dataset dataset, Map<String, Object> profile) {
        if (profile == null) return;

        if (profile.containsKey("row_count")) {
            dataset.setRowCount(((Number) profile.get("row_count")).intValue());
        }
        if (profile.containsKey("column_count")) {
            dataset.setColumnCount(((Number) profile.get("column_count")).intValue());
        }

        if (profile.containsKey("quality_score")) {
            Map<String, Object> qs = (Map<String, Object>) profile.get("quality_score");
            if (qs.containsKey("overall_score")) {
                dataset.setQualityScore(((Number) qs.get("overall_score")).doubleValue());
            }
            if (qs.containsKey("grade")) {
                dataset.setQualityGrade(String.valueOf(qs.get("grade")));
            }
        }

        // Populate Columns
        if (profile.containsKey("columns")) {
            datasetColumnRepository.deleteByDataset(dataset);
            List<Map<String, Object>> cols = (List<Map<String, Object>>) profile.get("columns");
            for (Map<String, Object> colMap : cols) {
                DatasetColumn col = DatasetColumn.builder()
                        .dataset(dataset)
                        .columnName(String.valueOf(colMap.get("name")))
                        .dataType(String.valueOf(colMap.get("data_type")))
                        .inferredType(String.valueOf(colMap.get("inferred_type")))
                        .nullCount(colMap.get("null_count") != null ? ((Number) colMap.get("null_count")).intValue() : 0)
                        .nullPercentage(colMap.get("null_percentage") != null ? ((Number) colMap.get("null_percentage")).doubleValue() : 0.0)
                        .distinctCount(colMap.get("distinct_count") != null ? ((Number) colMap.get("distinct_count")).intValue() : 0)
                        .isPrimaryKeyCandidate(Boolean.TRUE.equals(colMap.get("is_primary_key_candidate")))
                        .minValue(colMap.get("min_value") != null ? String.valueOf(colMap.get("min_value")) : null)
                        .maxValue(colMap.get("max_value") != null ? String.valueOf(colMap.get("max_value")) : null)
                        .meanVal(colMap.get("mean") != null ? ((Number) colMap.get("mean")).doubleValue() : null)
                        .medianVal(colMap.get("median") != null ? ((Number) colMap.get("median")).doubleValue() : null)
                        .stdDev(colMap.get("std_dev") != null ? ((Number) colMap.get("std_dev")).doubleValue() : null)
                        .build();
                datasetColumnRepository.save(col);
            }
        }
    }

    public List<DatasetDTO.DatasetSummary> getAllDatasets() {
        return datasetRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    public Dataset getDatasetEntity(Long id) {
        return datasetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dataset with id " + id + " not found."));
    }

    public DatasetDTO.DatasetDetail getDatasetDetail(Long id) {
        Dataset dataset = getDatasetEntity(id);
        List<DatasetColumn> columns = datasetColumnRepository.findByDataset(dataset);

        // Fetch live preview and recommendations from FastAPI
        List<Map<String, Object>> preview = List.of();
        Object qualityBreakdown = null;
        List<Object> recommendedViz = List.of();

        try {
            Map<String, Object> profile = fastApiClientService.profileDataset(dataset.getFilePath(), dataset.getName());
            if (profile != null) {
                preview = (List<Map<String, Object>>) profile.getOrDefault("preview_data", List.of());
                qualityBreakdown = profile.get("quality_score");
                recommendedViz = (List<Object>) profile.getOrDefault("recommended_visualizations", List.of());
            }
        } catch (Exception e) {
            log.warn("Could not fetch live profile from AI service: {}", e.getMessage());
        }

        return DatasetDTO.DatasetDetail.builder()
                .summary(toSummaryDTO(dataset))
                .columns(columns.stream().map(this::toColumnDTO).collect(Collectors.toList()))
                .previewData(preview)
                .qualityBreakdown(qualityBreakdown)
                .recommendedVisualizations(recommendedViz)
                .build();
    }

    @Transactional
    public void deleteDataset(Long id) {
        Dataset dataset = getDatasetEntity(id);
        try {
            File f = new File(dataset.getFilePath());
            if (f.exists()) f.delete();
        } catch (Exception ignored) {}
        datasetRepository.delete(dataset);
    }

    public DatasetDTO.DatasetSummary toSummaryDTO(Dataset dataset) {
        return DatasetDTO.DatasetSummary.builder()
                .id(dataset.getId())
                .name(dataset.getName())
                .originalFilename(dataset.getOriginalFilename())
                .fileFormat(dataset.getFileFormat())
                .fileSizeBytes(dataset.getFileSizeBytes())
                .rowCount(dataset.getRowCount())
                .columnCount(dataset.getColumnCount())
                .qualityScore(dataset.getQualityScore())
                .qualityGrade(dataset.getQualityGrade())
                .description(dataset.getDescription())
                .createdAt(dataset.getCreatedAt())
                .updatedAt(dataset.getUpdatedAt())
                .build();
    }

    public DatasetDTO.ColumnSummary toColumnDTO(DatasetColumn col) {
        return DatasetDTO.ColumnSummary.builder()
                .id(col.getId())
                .columnName(col.getColumnName())
                .dataType(col.getDataType())
                .inferredType(col.getInferredType())
                .nullCount(col.getNullCount())
                .nullPercentage(col.getNullPercentage())
                .distinctCount(col.getDistinctCount())
                .isPrimaryKeyCandidate(col.getIsPrimaryKeyCandidate())
                .minValue(col.getMinValue())
                .maxValue(col.getMaxValue())
                .meanVal(col.getMeanVal())
                .medianVal(col.getMedianVal())
                .stdDev(col.getStdDev())
                .build();
    }
}
