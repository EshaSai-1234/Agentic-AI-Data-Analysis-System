package com.agentic.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "datasets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false, length = 500)
    private String filePath;

    @Column(nullable = false, length = 20)
    private String fileFormat;

    @Column(nullable = false)
    private Long fileSizeBytes;

    @Builder.Default
    private Integer rowCount = 0;

    @Builder.Default
    private Integer columnCount = 0;

    @Builder.Default
    private Double qualityScore = 0.0;

    @Column(length = 10)
    @Builder.Default
    private String qualityGrade = "N/A";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();

    @Builder.Default
    private ZonedDateTime updatedAt = ZonedDateTime.now();

    @OneToMany(mappedBy = "dataset", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DatasetColumn> columns = new ArrayList<>();

    @OneToMany(mappedBy = "dataset", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChatSession> chatSessions = new ArrayList<>();

    @OneToMany(mappedBy = "dataset", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AnalysisReport> reports = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }
}
