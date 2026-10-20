package com.taskflow.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTaskDto {
    private String title;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL
    private String estimatedDuration;
    private String suggestedRole;
    @Builder.Default
    private List<String> dependencies = new ArrayList<>();
    private String acceptanceCriteria;
    @Builder.Default
    private boolean selected = true;
}
