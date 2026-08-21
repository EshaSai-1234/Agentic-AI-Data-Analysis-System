package com.agentic.ai.controller;

import com.agentic.ai.dto.AnalysisDTO;
import com.agentic.ai.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping("/eda/{datasetId}")
    public ResponseEntity<Map<String, Object>> getEDA(
            @PathVariable Long datasetId,
            @RequestParam(value = "columns", required = false) String columns) {
        return ResponseEntity.ok(analysisService.getEDA(datasetId, columns));
    }

    @GetMapping("/cleaning/recommendations/{datasetId}")
    public ResponseEntity<Map<String, Object>> getCleaningRecommendations(@PathVariable Long datasetId) {
        return ResponseEntity.ok(analysisService.getCleaningRecommendations(datasetId));
    }

    @PostMapping("/cleaning/apply")
    public ResponseEntity<Map<String, Object>> applyCleaning(@RequestBody AnalysisDTO.ApplyCleaningRequestDTO request) {
        return ResponseEntity.ok(analysisService.applyCleaning(request));
    }

    @PostMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareDatasets(@RequestBody AnalysisDTO.CompareRequestDTO request) {
        return ResponseEntity.ok(analysisService.compareDatasets(request.getDatasetIdA(), request.getDatasetIdB()));
    }
}
