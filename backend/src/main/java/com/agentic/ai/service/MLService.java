package com.agentic.ai.service;

import com.agentic.ai.dto.MLDTO;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.MLModelRecord;
import com.agentic.ai.entity.User;
import com.agentic.ai.repository.MLModelRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLService {

    private final DatasetService datasetService;
    private final FastApiClientService fastApiClientService;
    private final MLModelRecordRepository mlModelRecordRepository;
    private final AuthService authService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Map<String, Object> trainModel(MLDTO.TrainRequestDTO request) {
        User user = authService.getCurrentUser();
        Dataset dataset = datasetService.getDatasetEntity(request.getDatasetId());

        Map<String, Object> trainPayload = new HashMap<>();
        trainPayload.put("file_path", dataset.getFilePath());
        trainPayload.put("target_column", request.getTargetColumn());
        trainPayload.put("task_type", request.getTaskType() != null ? request.getTaskType() : "auto");
        trainPayload.put("feature_columns", request.getFeatureColumns());
        trainPayload.put("model_algorithm", request.getModelAlgorithm() != null ? request.getModelAlgorithm() : "auto");
        trainPayload.put("test_size", request.getTestSize() != null ? request.getTestSize() : 0.2);

        Map<String, Object> resp = fastApiClientService.trainMLModel(trainPayload);

        // Save trained model record
        try {
            String modelId = String.valueOf(resp.get("model_id"));
            String taskType = String.valueOf(resp.get("task_type"));
            String algo = String.valueOf(resp.get("algorithm"));
            String target = (String) resp.get("target_column");

            MLModelRecord record = MLModelRecord.builder()
                    .dataset(dataset)
                    .user(user)
                    .modelUuid(modelId)
                    .taskType(taskType)
                    .algorithm(algo)
                    .targetColumn(target)
                    .featuresJson(objectMapper.writeValueAsString(resp.get("feature_columns")))
                    .metricsJson(objectMapper.writeValueAsString(resp.get("metrics")))
                    .featureImportanceJson(objectMapper.writeValueAsString(resp.get("feature_importance")))
                    .confusionMatrixJson(objectMapper.writeValueAsString(resp.get("confusion_matrix")))
                    .build();

            mlModelRecordRepository.save(record);
        } catch (Exception e) {
            log.warn("Could not save MLModelRecord entity: {}", e.getMessage());
        }

        return resp;
    }

    public Map<String, Object> predict(MLDTO.PredictRequestDTO request) {
        return fastApiClientService.predictML(request.getModelId(), request.getInputData());
    }

    public List<MLModelRecord> getModelsForDataset(Long datasetId) {
        Dataset dataset = datasetService.getDatasetEntity(datasetId);
        return mlModelRecordRepository.findByDatasetOrderByCreatedAtDesc(dataset);
    }
}
