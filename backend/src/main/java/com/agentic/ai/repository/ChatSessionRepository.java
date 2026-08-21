package com.agentic.ai.repository;

import com.agentic.ai.entity.ChatSession;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByDatasetOrderByUpdatedAtDesc(Dataset dataset);
    List<ChatSession> findByUserOrderByUpdatedAtDesc(User user);
}
