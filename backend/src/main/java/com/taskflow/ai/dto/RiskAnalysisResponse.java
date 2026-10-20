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
public class RiskAnalysisResponse {
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private int riskScore;    // 0 to 100
    private int overdueTasksCount;
    private int blockedTasksCount;
    private int criticalTasksCount;
    private int unresolvedDependencyTasksCount;
    private Long daysUntilProjectDeadline;
    @Builder.Default
    private List<RiskFactorDto> factors = new ArrayList<>();
    @Builder.Default
    private List<String> recommendations = new ArrayList<>();
    private String explanation;
}
