package com.agentic.ai.controller;

import com.agentic.ai.dto.MLDTO;
import com.agentic.ai.entity.MLModelRecord;
import com.agentic.ai.service.MLService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ml")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MLController {

    private final MLService mlService;

    @PostMapping("/train")
    public ResponseEntity<Map<String, Object>> trainModel(@Valid @RequestBody MLDTO.TrainRequestDTO request) {
        return ResponseEntity.ok(mlService.trainModel(request));
    }

    @PostMapping("/predict")
    public ResponseEntity<Map<String, Object>> predict(@Valid @RequestBody MLDTO.PredictRequestDTO request) {
        return ResponseEntity.ok(mlService.predict(request));
    }

    @GetMapping("/models/dataset/{datasetId}")
    public ResponseEntity<List<MLModelRecord>> getModelsForDataset(@PathVariable Long datasetId) {
        return ResponseEntity.ok(mlService.getModelsForDataset(datasetId));
    }
}
