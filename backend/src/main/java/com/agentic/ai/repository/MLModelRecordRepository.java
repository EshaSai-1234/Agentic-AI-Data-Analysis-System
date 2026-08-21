package com.agentic.ai.repository;

import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.MLModelRecord;
import com.agentic.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MLModelRecordRepository extends JpaRepository<MLModelRecord, Long> {
    List<MLModelRecord> findByDatasetOrderByCreatedAtDesc(Dataset dataset);
    List<MLModelRecord> findByUserOrderByCreatedAtDesc(User user);
    Optional<MLModelRecord> findByModelUuid(String modelUuid);
}
