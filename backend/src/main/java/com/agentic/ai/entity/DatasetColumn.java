package com.agentic.ai.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dataset_columns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatasetColumn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dataset_id", nullable = false)
    private Dataset dataset;

    @Column(nullable = false)
    private String columnName;

    @Column(nullable = false, length = 50)
    private String dataType;

    @Column(nullable = false, length = 50)
    private String inferredType;

    @Builder.Default
    private Integer nullCount = 0;

    @Builder.Default
    private Double nullPercentage = 0.0;

    @Builder.Default
    private Integer distinctCount = 0;

    @Builder.Default
    private Boolean isPrimaryKeyCandidate = false;

    private String minValue;
    private String maxValue;
    private Double meanVal;
    private Double medianVal;
    private Double stdDev;
}
