package com.taskflow.task;

import com.taskflow.activity.TaskActivity;
import com.taskflow.activity.TaskActivityRepository;
import com.taskflow.common.PageResponse;
import com.taskflow.project.Project;
import com.taskflow.project.ProjectRepository;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskActivityRepository activityRepository;
    private final TaskMapper taskMapper;

    @Transactional(readOnly = true)
    public PageResponse<TaskDto> getTasksByProject(Long projectId, int page, int size) {
        return PageResponse.from(
                taskRepository.findByProjectId(projectId,
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))
                        .map(taskMapper::toDto));
    }

    @Transactional(readOnly = true)
    public TaskDto getTask(Long taskId) {
        return taskMapper.toDto(findTaskOrThrow(taskId));
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getMyTasks(String email) {
        User user = findUserByEmail(email);
        return taskRepository.findByAssigneeId(user.getId()).stream()
                .map(taskMapper::toDto).toList();
    }

    @Transactional
    public TaskDto createTask(Long projectId, CreateTaskRequest request, String requesterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        // Only the project manager can create tasks
        if (!project.getManager().getEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("Only the project manager can create tasks");
        }

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new EntityNotFoundException("Assignee not found"));
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .progress(request.getProgress())
                .dueDate(request.getDueDate())
                .project(project)
                .assignee(assignee)
                .build();

        Task saved = taskRepository.save(task);
        logActivity(saved, findUserByEmail(requesterEmail), "CREATED", null, "Task created");
        return taskMapper.toDto(saved);
    }

    @Transactional
    public TaskDto updateTask(Long taskId, UpdateTaskRequest request, String requesterEmail) {
        Task task = findTaskOrThrow(taskId);
        User requester = findUserByEmail(requesterEmail);
        assertCanEditTask(task, requester);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getProgress() != null) task.setProgress(request.getProgress());

        // Only manager can reassign
        if (request.getAssigneeId() != null && requester.getRole() == User.Role.MANAGER) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new EntityNotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        }

        if (request.getStatus() != null) {
            String oldStatus = task.getStatus().name();
            task.setStatus(request.getStatus());
            logActivity(task, requester, "STATUS_CHANGED", oldStatus, request.getStatus().name());
        }

        return taskMapper.toDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto updateStatus(Long taskId, Task.Status newStatus, String requesterEmail) {
        Task task = findTaskOrThrow(taskId);
        User requester = findUserByEmail(requesterEmail);
        assertCanEditTask(task, requester);

        String oldStatus = task.getStatus().name();
        task.setStatus(newStatus);
        logActivity(task, requester, "STATUS_CHANGED", oldStatus, newStatus.name());
        return taskMapper.toDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto updateProgress(Long taskId, int progress, String requesterEmail) {
        Task task = findTaskOrThrow(taskId);
        User requester = findUserByEmail(requesterEmail);
        assertCanEditTask(task, requester);

        String oldProgress = String.valueOf(task.getProgress());
        task.setProgress(progress);
        logActivity(task, requester, "PROGRESS_UPDATED", oldProgress, String.valueOf(progress));
        return taskMapper.toDto(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long taskId, String requesterEmail) {
        Task task = findTaskOrThrow(taskId);
        if (!task.getProject().getManager().getEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("Only the project manager can delete tasks");
        }
        taskRepository.delete(task);
    }

    public Task findTaskOrThrow(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + taskId));
    }

    private void assertCanEditTask(Task task, User requester) {
        boolean isManager = requester.getRole() == User.Role.MANAGER
                && task.getProject().getManager().getId().equals(requester.getId());
        boolean isAssignee = task.getAssignee() != null
                && task.getAssignee().getId().equals(requester.getId());
        if (!isManager && !isAssignee) {
            throw new AccessDeniedException("You are not authorized to edit this task");
        }
    }

    private void logActivity(Task task, User actor, String action, String oldValue, String newValue) {
        activityRepository.save(TaskActivity.builder()
                .task(task)
                .actor(actor)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .build());
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }
}
