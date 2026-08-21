package com.agentic.ai.controller;

import com.agentic.ai.dto.ReportDTO;
import com.agentic.ai.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/generate")
    public ResponseEntity<ReportDTO.ReportDetailDTO> generateReport(@Valid @RequestBody ReportDTO.GenerateRequestDTO request) {
        return ResponseEntity.ok(reportService.generateReport(request));
    }

    @GetMapping("/dataset/{datasetId}")
    public ResponseEntity<List<ReportDTO.ReportSummaryDTO>> getReportsForDataset(@PathVariable Long datasetId) {
        return ResponseEntity.ok(reportService.getReportsForDataset(datasetId));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ReportDTO.ReportDetailDTO> getReportDetail(@PathVariable Long reportId) {
        return ResponseEntity.ok(reportService.getReportDetail(reportId));
    }
}
