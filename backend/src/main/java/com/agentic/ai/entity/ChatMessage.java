package com.agentic.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_session_id", nullable = false)
    private ChatSession chatSession;

    @Column(nullable = false, length = 20)
    private String sender; // USER or ASSISTANT

    @Column(columnDefinition = "TEXT", nullable = false)
    private String queryText;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    private String intent;
    private String chartType;

    @Column(columnDefinition = "TEXT")
    private String chartConfigJson;

    @Column(columnDefinition = "TEXT")
    private String statsJson;

    @Column(columnDefinition = "TEXT")
    private String safeCodeSnippet;

    private Double executionTimeMs;

    @Column(columnDefinition = "TEXT")
    private String limitations;

    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();
}
