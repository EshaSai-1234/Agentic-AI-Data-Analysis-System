package com.agentic.ai.service;

import com.agentic.ai.dto.ChatDTO;
import com.agentic.ai.entity.ChatMessage;
import com.agentic.ai.entity.ChatSession;
import com.agentic.ai.entity.Dataset;
import com.agentic.ai.entity.User;
import com.agentic.ai.exception.ResourceNotFoundException;
import com.agentic.ai.repository.ChatMessageRepository;
import com.agentic.ai.repository.ChatSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DatasetService datasetService;
    private final FastApiClientService fastApiClientService;
    private final AuthService authService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ChatDTO.ChatMessageDTO processQuery(ChatDTO.ChatQueryRequest request) {
        User user = authService.getCurrentUser();
        Dataset dataset = datasetService.getDatasetEntity(request.getDatasetId());

        ChatSession session;
        if (request.getChatSessionId() != null) {
            session = chatSessionRepository.findById(request.getChatSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));
        } else {
            session = ChatSession.builder()
                    .dataset(dataset)
                    .user(user)
                    .sessionTitle(request.getQuery().length() > 40 ? request.getQuery().substring(0, 40) + "..." : request.getQuery())
                    .build();
            session = chatSessionRepository.save(session);
        }

        // 1. Save User Message
        ChatMessage userMsg = ChatMessage.builder()
                .chatSession(session)
                .sender("USER")
                .queryText(request.getQuery())
                .build();
        chatMessageRepository.save(userMsg);

        // 2. Build Chat History
        List<ChatMessage> pastMessages = chatMessageRepository.findByChatSessionOrderByCreatedAtAsc(session);
        List<Map<String, String>> history = pastMessages.stream()
                .map(m -> Map.of(
                        "sender", m.getSender(),
                        "query", m.getQueryText(),
                        "explanation", m.getExplanation() != null ? m.getExplanation() : ""
                ))
                .collect(Collectors.toList());

        // 3. Delegate to FastAPI Supervisor Agent
        Map<String, Object> aiResp = fastApiClientService.executeQuery(dataset.getFilePath(), request.getQuery(), history);

        // 4. Parse AI Response
        String explanation = String.valueOf(aiResp.getOrDefault("natural_language_explanation", ""));
        String intent = String.valueOf(aiResp.getOrDefault("intent", "general_query"));
        String chartType = (String) aiResp.get("chart_type");
        Object chartConfig = aiResp.get("chart_config");
        Object stats = aiResp.get("result_summary");
        String safeCode = (String) aiResp.get("safe_code_snippet");
        Double execTime = aiResp.get("execution_time_ms") != null ? ((Number) aiResp.get("execution_time_ms")).doubleValue() : 0.0;
        String limitations = (String) aiResp.get("limitations");
        List<String> followups = (List<String>) aiResp.getOrDefault("suggested_followups", List.of());
        List<Map<String, Object>> resultData = (List<Map<String, Object>>) aiResp.get("result_data");

        // 5. Save Assistant Message
        String chartJsonStr = null;
        String statsJsonStr = null;
        try {
            if (chartConfig != null) chartJsonStr = objectMapper.writeValueAsString(chartConfig);
            if (stats != null) statsJsonStr = objectMapper.writeValueAsString(stats);
        } catch (Exception ignored) {}

        ChatMessage assistantMsg = ChatMessage.builder()
                .chatSession(session)
                .sender("ASSISTANT")
                .queryText(request.getQuery())
                .explanation(explanation)
                .intent(intent)
                .chartType(chartType)
                .chartConfigJson(chartJsonStr)
                .statsJson(statsJsonStr)
                .safeCodeSnippet(safeCode)
                .executionTimeMs(execTime)
                .limitations(limitations)
                .build();
        assistantMsg = chatMessageRepository.save(assistantMsg);

        return ChatDTO.ChatMessageDTO.builder()
                .id(assistantMsg.getId())
                .chatSessionId(session.getId())
                .sender("ASSISTANT")
                .queryText(request.getQuery())
                .explanation(explanation)
                .intent(intent)
                .chartType(chartType)
                .chartConfig(chartConfig)
                .stats(stats)
                .safeCodeSnippet(safeCode)
                .executionTimeMs(execTime)
                .limitations(limitations)
                .suggestedFollowups(followups)
                .resultData(resultData)
                .createdAt(assistantMsg.getCreatedAt())
                .build();
    }

    public List<ChatDTO.ChatSessionDTO> getSessionsForDataset(Long datasetId) {
        Dataset dataset = datasetService.getDatasetEntity(datasetId);
        return chatSessionRepository.findByDatasetOrderByUpdatedAtDesc(dataset).stream()
                .map(this::toSessionDTO)
                .collect(Collectors.toList());
    }

    public ChatDTO.ChatSessionDTO getSessionDetail(Long sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        return toSessionDTO(session);
    }

    private ChatDTO.ChatSessionDTO toSessionDTO(ChatSession session) {
        List<ChatMessage> messages = chatMessageRepository.findByChatSessionOrderByCreatedAtAsc(session);
        return ChatDTO.ChatSessionDTO.builder()
                .id(session.getId())
                .datasetId(session.getDataset() != null ? session.getDataset().getId() : null)
                .sessionTitle(session.getSessionTitle())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .messages(messages.stream().map(this::toMessageDTO).collect(Collectors.toList()))
                .build();
    }

    private ChatDTO.ChatMessageDTO toMessageDTO(ChatMessage m) {
        Object chartConfig = null;
        Object stats = null;
        try {
            if (m.getChartConfigJson() != null) chartConfig = objectMapper.readValue(m.getChartConfigJson(), Object.class);
            if (m.getStatsJson() != null) stats = objectMapper.readValue(m.getStatsJson(), Object.class);
        } catch (Exception ignored) {}

        return ChatDTO.ChatMessageDTO.builder()
                .id(m.getId())
                .chatSessionId(m.getChatSession().getId())
                .sender(m.getSender())
                .queryText(m.getQueryText())
                .explanation(m.getExplanation())
                .intent(m.getIntent())
                .chartType(m.getChartType())
                .chartConfig(chartConfig)
                .stats(stats)
                .safeCodeSnippet(m.getSafeCodeSnippet())
                .executionTimeMs(m.getExecutionTimeMs())
                .limitations(m.getLimitations())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
