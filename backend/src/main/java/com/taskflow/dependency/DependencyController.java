package com.taskflow.dependency;

import com.taskflow.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/dependencies")
@RequiredArgsConstructor
public class DependencyController {

    private final DependencyService dependencyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Long>>> getDependencies(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(dependencyService.getDependencies(taskId)));
    }

    @PostMapping("/{dependsOnId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> addDependency(
            @PathVariable Long taskId, @PathVariable Long dependsOnId) {
        dependencyService.addDependency(taskId, dependsOnId);
        return ResponseEntity.ok(ApiResponse.success("Dependency added", null));
    }

    @DeleteMapping("/{dependsOnId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> removeDependency(
            @PathVariable Long taskId, @PathVariable Long dependsOnId) {
        dependencyService.removeDependency(taskId, dependsOnId);
        return ResponseEntity.ok(ApiResponse.success("Dependency removed", null));
    }
}
