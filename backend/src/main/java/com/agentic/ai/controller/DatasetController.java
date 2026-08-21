package com.agentic.ai.controller;

import com.agentic.ai.dto.DatasetDTO;
import com.agentic.ai.service.DatasetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DatasetController {

    private final DatasetService datasetService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DatasetDTO.DatasetDetail> uploadDataset(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description) {
        return ResponseEntity.ok(datasetService.uploadDataset(file, name, description));
    }

    @GetMapping
    public ResponseEntity<List<DatasetDTO.DatasetSummary>> getAllDatasets() {
        return ResponseEntity.ok(datasetService.getAllDatasets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DatasetDTO.DatasetDetail> getDatasetDetail(@PathVariable Long id) {
        return ResponseEntity.ok(datasetService.getDatasetDetail(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDataset(@PathVariable Long id) {
        datasetService.deleteDataset(id);
        return ResponseEntity.noContent().build();
    }
}
