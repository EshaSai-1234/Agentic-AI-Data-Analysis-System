package com.agentic.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "ml_models")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MLModelRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dataset_id", nullable = false)
    private Dataset dataset;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 50)
    private String modelUuid;

    @Column(nullable = false, length = 50)
    private String taskType;

    @Column(nullable = false, length = 100)
    private String algorithm;

    private String targetColumn;

    @Column(columnDefinition = "TEXT")
    private String featuresJson;

    @Column(columnDefinition = "TEXT")
    private String metricsJson;

    @Column(columnDefinition = "TEXT")
    private String featureImportanceJson;

    @Column(columnDefinition = "TEXT")
    private String confusionMatrixJson;

    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();
}
