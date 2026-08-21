package com.agentic.ai.repository;

import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DatasetRepository extends JpaRepository<Dataset, Long> {
    List<Dataset> findByUserOrderByCreatedAtDesc(User user);
    List<Dataset> findAllByOrderByCreatedAtDesc();
}
