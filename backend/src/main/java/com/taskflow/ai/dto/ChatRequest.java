package com.taskflow.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatRequest {
    @NotBlank(message = "Message cannot be blank")
    private String message;
    private Long projectId;
}
