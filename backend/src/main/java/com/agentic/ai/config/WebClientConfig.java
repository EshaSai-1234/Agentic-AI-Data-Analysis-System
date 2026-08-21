package com.agentic.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${app.fastapi.base-url:http://localhost:8000}")
    private String fastApiBaseUrl;

    @Bean
    public WebClient fastApiWebClient() {
        // Configure 50MB in-memory buffer size for large dataset previews & charts
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(50 * 1024 * 1024))
                .build();

        return WebClient.builder()
                .baseUrl(fastApiBaseUrl)
                .exchangeStrategies(strategies)
                .build();
    }
}
