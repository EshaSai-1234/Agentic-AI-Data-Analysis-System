package com.agentic.ai.repository;

import com.agentic.ai.entity.CleanedDataset;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CleanedDatasetRepository extends JpaRepository<CleanedDataset, Long> {
    List<CleanedDataset> findByOriginalDatasetOrderByCreatedAtDesc(Dataset dataset);
    List<CleanedDataset> findByUserOrderByCreatedAtDesc(User user);
}
