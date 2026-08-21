package com.agentic.ai.controller;

import com.agentic.ai.dto.ChatDTO;
import com.agentic.ai.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/query")
    public ResponseEntity<ChatDTO.ChatMessageDTO> sendQuery(@Valid @RequestBody ChatDTO.ChatQueryRequest request) {
        return ResponseEntity.ok(chatService.processQuery(request));
    }

    @GetMapping("/sessions/dataset/{datasetId}")
    public ResponseEntity<List<ChatDTO.ChatSessionDTO>> getSessionsForDataset(@PathVariable Long datasetId) {
        return ResponseEntity.ok(chatService.getSessionsForDataset(datasetId));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ChatDTO.ChatSessionDTO> getSessionDetail(@PathVariable Long sessionId) {
        return ResponseEntity.ok(chatService.getSessionDetail(sessionId));
    }
}
