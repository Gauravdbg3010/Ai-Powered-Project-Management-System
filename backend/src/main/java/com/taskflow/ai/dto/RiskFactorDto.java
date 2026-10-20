package com.taskflow.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskFactorDto {
    private String factor;
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String evidence;
}
