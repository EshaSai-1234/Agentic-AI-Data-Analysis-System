package com.agentic.ai.repository;

import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.DatasetColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DatasetColumnRepository extends JpaRepository<DatasetColumn, Long> {
    List<DatasetColumn> findByDataset(Dataset dataset);
    void deleteByDataset(Dataset dataset);
}
