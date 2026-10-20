package com.taskflow.ai.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConfigDto {
    private String apiKey;
    private String provider; // "gemini" or "openai"
    private String model;
    private boolean configured;
}
