package com.taskflow.task;

import com.taskflow.common.ApiResponse;
import com.taskflow.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<PageResponse<TaskDto>>> getProjectTasks(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByProject(projectId, page, size)));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<TaskDto>> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        TaskDto task = taskService.createTask(projectId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Task created", task));
    }

    @GetMapping("/api/tasks/my")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getMyTasks(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks(userDetails.getUsername())));
    }

    @GetMapping("/api/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskDto>> getTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTask(taskId)));
    }

    @PutMapping("/api/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskDto>> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Task updated",
                taskService.updateTask(taskId, request, userDetails.getUsername())));
    }

    @PatchMapping("/api/tasks/{taskId}/status")
    public ResponseEntity<ApiResponse<TaskDto>> updateStatus(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                taskService.updateStatus(taskId, request.getStatus(), userDetails.getUsername())));
    }

    @PatchMapping("/api/tasks/{taskId}/progress")
    public ResponseEntity<ApiResponse<TaskDto>> updateProgress(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateProgressRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Progress updated",
                taskService.updateProgress(taskId, request.getProgress(), userDetails.getUsername())));
    }

    @DeleteMapping("/api/tasks/{taskId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {
        taskService.deleteTask(taskId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }
}
