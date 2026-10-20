package com.taskflow.project;

import com.taskflow.common.PageResponse;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;

    @Transactional(readOnly = true)
    public PageResponse<ProjectDto> getProjects(String search, String statusStr, int page, int size) {
        Project.Status status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            status = Project.Status.valueOf(statusStr.toUpperCase());
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PageResponse.from(projectRepository.findAllFiltered(search, status, pageable)
                .map(projectMapper::toDto));
    }

    @Transactional(readOnly = true)
    public ProjectDto getProject(Long projectId) {
        return projectMapper.toDto(findProjectOrThrow(projectId));
    }

    @Transactional
    public ProjectDto createProject(CreateProjectRequest request, String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new EntityNotFoundException("Manager not found"));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .manager(manager)
                .archived(false)
                .build();

        return projectMapper.toDto(projectRepository.save(project));
    }

    @Transactional
    public ProjectDto updateProject(Long projectId, UpdateProjectRequest request, String requesterEmail) {
        Project project = findProjectOrThrow(projectId);
        assertIsManager(project, requesterEmail);

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate());

        return projectMapper.toDto(projectRepository.save(project));
    }

    @Transactional
    public void archiveProject(Long projectId, String requesterEmail) {
        Project project = findProjectOrThrow(projectId);
        assertIsManager(project, requesterEmail);
        project.setArchived(true);
        projectRepository.save(project);
    }

    @Transactional
    public void restoreProject(Long projectId, String requesterEmail) {
        Project project = findProjectOrThrow(projectId);
        assertIsManager(project, requesterEmail);
        project.setArchived(false);
        projectRepository.save(project);
    }

    public List<ProjectDto> getProjectsByManager(Long managerId) {
        return projectRepository.findByManagerId(managerId).stream()
                .map(projectMapper::toDto)
                .toList();
    }

    public Project findProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + projectId));
    }

    private void assertIsManager(Project project, String email) {
        if (!project.getManager().getEmail().equals(email)) {
            throw new AccessDeniedException("Only the project manager can perform this action");
        }
    }
}
