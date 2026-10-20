package com.taskflow.activity;

import com.taskflow.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ActivityController {

    private final TaskActivityRepository activityRepository;

    @GetMapping("/tasks/{taskId}/activities")
    public ResponseEntity<ApiResponse<List<ActivityDto>>> getTaskActivities(@PathVariable Long taskId) {
        List<ActivityDto> activities = activityRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/projects/{projectId}/activities")
    public ResponseEntity<ApiResponse<List<ActivityDto>>> getProjectActivities(@PathVariable Long projectId) {
        List<ActivityDto> activities = activityRepository
                .findTop10ByTaskProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    private ActivityDto toDto(TaskActivity a) {
        return ActivityDto.builder()
                .id(a.getId())
                .taskId(a.getTask().getId())
                .taskTitle(a.getTask().getTitle())
                .actorId(a.getActor().getId())
                .actorName(a.getActor().getName())
                .action(a.getAction())
                .oldValue(a.getOldValue())
                .newValue(a.getNewValue())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
