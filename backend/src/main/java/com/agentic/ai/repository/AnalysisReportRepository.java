package com.agentic.ai.repository;

import com.agentic.ai.entity.AnalysisReport;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisReportRepository extends JpaRepository<AnalysisReport, Long> {
    List<AnalysisReport> findByDatasetOrderByCreatedAtDesc(Dataset dataset);
    List<AnalysisReport> findByUserOrderByCreatedAtDesc(User user);
}
