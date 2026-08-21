package com.agentic.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "cleaned_datasets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CleanedDataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_dataset_id", nullable = false)
    private Dataset originalDataset;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 500)
    private String filePath;

    private Integer rowCount;
    private Integer columnCount;

    private Double qualityScoreBefore;
    private Double qualityScoreAfter;

    @Column(columnDefinition = "TEXT")
    private String recipeJson;

    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();
}
