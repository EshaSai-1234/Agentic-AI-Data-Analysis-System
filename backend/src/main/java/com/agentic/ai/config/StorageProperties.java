package com.agentic.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
@Setter
public class StorageProperties {

    @Value("${app.storage.upload-dir:./storage/uploads}")
    private String uploadDir;
}
