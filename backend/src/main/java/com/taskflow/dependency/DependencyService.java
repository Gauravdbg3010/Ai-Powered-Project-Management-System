package com.taskflow.dependency;

import com.taskflow.task.Task;
import com.taskflow.task.TaskRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DependencyService {

    private final TaskDependencyRepository dependencyRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public void addDependency(Long taskId, Long dependsOnId) {
        if (taskId.equals(dependsOnId)) {
            throw new IllegalArgumentException("A task cannot depend on itself");
        }
        if (dependencyRepository.existsByTaskIdAndDependsOnId(taskId, dependsOnId)) {
            throw new IllegalStateException("Dependency already exists");
        }
        // Check for circular dependency before adding
        if (wouldCreateCycle(taskId, dependsOnId)) {
            throw new IllegalArgumentException("Adding this dependency would create a circular dependency");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found: " + taskId));
        Task dependsOn = taskRepository.findById(dependsOnId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found: " + dependsOnId));

        dependencyRepository.save(TaskDependency.builder().task(task).dependsOn(dependsOn).build());
    }

    @Transactional
    public void removeDependency(Long taskId, Long dependsOnId) {
        dependencyRepository.deleteByTaskIdAndDependsOnId(taskId, dependsOnId);
    }

    public List<Long> getDependencies(Long taskId) {
        return dependencyRepository.findByTaskId(taskId).stream()
                .map(d -> d.getDependsOn().getId()).toList();
    }

    /**
     * DFS check: if dependsOnId can already reach taskId through existing dependencies,
     * adding taskId -> dependsOnId would create a cycle.
     */
    private boolean wouldCreateCycle(Long taskId, Long dependsOnId) {
        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(dependsOnId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();
            if (current.equals(taskId)) return true;
            if (visited.contains(current)) continue;
            visited.add(current);
            dependencyRepository.findByTaskId(current).forEach(d -> queue.add(d.getDependsOn().getId()));
        }
        return false;
    }
}
