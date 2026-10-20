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
public class ImplementationPlanResponse {
    private Long taskId;
    private String taskTitle;
    @Builder.Default
    private List<String> prerequisites = new ArrayList<>();
    @Builder.Default
    private List<String> stepByStepSubtasks = new ArrayList<>();
    @Builder.Default
    private List<String> completionCriteria = new ArrayList<>();
    private String technicalConsiderations;
}
