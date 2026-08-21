package com.agentic.ai.service;

import com.agentic.ai.config.StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final StorageProperties storageProperties;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("csv", "tsv", "xlsx", "xls");

    public String storeFile(MultipartFile file) {
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        
        if (originalFilename.contains("..")) {
            throw new IllegalArgumentException("Cannot store file with relative path sequence: " + originalFilename);
        }

        String extension = getExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file format: ." + extension + ". Allowed: CSV, XLSX, TSV");
        }

        try {
            Path targetDir = Paths.get(storageProperties.getUploadDir()).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);

            String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path targetLocation = targetDir.resolve(uniqueFilename);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return targetLocation.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", ex);
        }
    }

    public String getExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1) return "";
        return filename.substring(lastIndex + 1);
    }
}
