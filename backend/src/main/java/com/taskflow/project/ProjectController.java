package com.taskflow.project;

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

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProjectDto>>> getProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjects(search, status, page, size)));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectDto>> getProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProject(projectId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProjectDto created = projectService.createProject(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Project created", created));
    }

    @PutMapping("/{projectId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Project updated",
                projectService.updateProject(projectId, request, userDetails.getUsername())));
    }

    @PatchMapping("/{projectId}/archive")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> archiveProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.archiveProject(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Project archived", null));
    }

    @PatchMapping("/{projectId}/restore")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> restoreProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.restoreProject(projectId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Project restored", null));
    }
}
