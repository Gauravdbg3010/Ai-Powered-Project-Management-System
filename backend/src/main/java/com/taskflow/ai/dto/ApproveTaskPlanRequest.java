package com.taskflow.ai.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ApproveTaskPlanRequest {
    @NotEmpty(message = "Tasks list cannot be empty")
    private List<AiTaskDto> tasks;
}
