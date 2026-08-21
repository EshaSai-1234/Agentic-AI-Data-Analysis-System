package com.agentic.ai.service;

import com.agentic.ai.dto.ReportDTO;
import com.agentic.ai.entity.AnalysisReport;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.User;
import com.agentic.ai.exception.ResourceNotFoundException;
import com.agentic.ai.repository.AnalysisReportRepository;
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
public class ReportService {

    private final DatasetService datasetService;
    private final FastApiClientService fastApiClientService;
    private final AnalysisReportRepository analysisReportRepository;
    private final AuthService authService;

    @Transactional
    public ReportDTO.ReportDetailDTO generateReport(ReportDTO.GenerateRequestDTO request) {
        User user = authService.getCurrentUser();
        Dataset dataset = datasetService.getDatasetEntity(request.getDatasetId());

        Map<String, Object> resp = fastApiClientService.generateReport(
                dataset.getFilePath(),
                dataset.getName(),
                request.getCustomTitle(),
                request.getIncludeSections()
        );

        String title = (String) resp.getOrDefault("report_title", "Executive Report");
        String execSummary = (String) resp.get("executive_summary");
        Double quality = resp.get("quality_score") != null ? ((Number) resp.get("quality_score")).doubleValue() : dataset.getQualityScore();
        String markdown = (String) resp.get("markdown_content");
        String html = (String) resp.get("html_content");

        AnalysisReport report = AnalysisReport.builder()
                .dataset(dataset)
                .user(user)
                .title(title)
                .executiveSummary(execSummary)
                .qualityScore(quality)
                .markdownContent(markdown)
                .htmlContent(html)
                .build();

        report = analysisReportRepository.save(report);

        return toDetailDTO(report);
    }

    public List<ReportDTO.ReportSummaryDTO> getReportsForDataset(Long datasetId) {
        Dataset dataset = datasetService.getDatasetEntity(datasetId);
        return analysisReportRepository.findByDatasetOrderByCreatedAtDesc(dataset).stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    public ReportDTO.ReportDetailDTO getReportDetail(Long reportId) {
        AnalysisReport report = analysisReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));
        return toDetailDTO(report);
    }

    private ReportDTO.ReportSummaryDTO toSummaryDTO(AnalysisReport report) {
        return ReportDTO.ReportSummaryDTO.builder()
                .id(report.getId())
                .datasetId(report.getDataset().getId())
                .title(report.getTitle())
                .executiveSummary(report.getExecutiveSummary())
                .qualityScore(report.getQualityScore())
                .createdAt(report.getCreatedAt())
                .build();
    }

    private ReportDTO.ReportDetailDTO toDetailDTO(AnalysisReport report) {
        return ReportDTO.ReportDetailDTO.builder()
                .id(report.getId())
                .datasetId(report.getDataset().getId())
                .title(report.getTitle())
                .executiveSummary(report.getExecutiveSummary())
                .qualityScore(report.getQualityScore())
                .markdownContent(report.getMarkdownContent())
                .htmlContent(report.getHtmlContent())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
