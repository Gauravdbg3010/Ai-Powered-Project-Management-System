package com.taskflow.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateTaskPlanRequest {
    @NotBlank(message = "Project description is required")
    private String projectDescription;
    private String objectives;
    private String techStack;
    private String deadline;
    private String teamContext;
}
