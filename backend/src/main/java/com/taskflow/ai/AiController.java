package com.taskflow.ai;

import com.taskflow.ai.dto.*;
import com.taskflow.common.ApiResponse;
import com.taskflow.task.TaskDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<AiConfigDto>> getAiConfig() {
        return ResponseEntity.ok(ApiResponse.success(aiService.getAiConfig()));
    }

    @PostMapping("/config")
    public ResponseEntity<ApiResponse<AiConfigDto>> updateAiConfig(
            @RequestBody AiConfigDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("AI configuration updated successfully", aiService.updateAiConfig(dto)));
    }

    @PostMapping("/projects/{projectId}/task-plan")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<AiTaskDto>>> generateTaskPlan(
            @PathVariable Long projectId,
            @Valid @RequestBody GenerateTaskPlanRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AiTaskDto> tasks = aiService.generateTaskPlan(projectId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("AI task plan generated successfully", tasks));
    }

    @PostMapping("/projects/{projectId}/task-plan/approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<TaskDto>>> approveTaskPlan(
            @PathVariable Long projectId,
            @Valid @RequestBody ApproveTaskPlanRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<TaskDto> createdTasks = aiService.approveTaskPlan(projectId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("AI task plan approved and tasks created successfully", createdTasks));
    }

    @GetMapping("/projects/{projectId}/risk")
    public ResponseEntity<ApiResponse<RiskAnalysisResponse>> getProjectRisk(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(aiService.analyzeProjectRisk(projectId, userDetails.getUsername())));
    }

    @GetMapping("/projects/{projectId}/summary")
    public ResponseEntity<ApiResponse<String>> getProjectSummary(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(aiService.generateProgressSummary(projectId, userDetails.getUsername())));
    }

    @PostMapping("/assistant/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chatWithAssistant(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(aiService.chatWithAssistant(request, userDetails.getUsername())));
    }

    @GetMapping("/tasks/{taskId}/implementation-plan")
    public ResponseEntity<ApiResponse<ImplementationPlanResponse>> getImplementationPlan(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(aiService.getImplementationPlan(taskId, userDetails.getUsername())));
    }
}
