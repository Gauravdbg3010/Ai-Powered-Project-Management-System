package com.taskflow.dependency;

import com.taskflow.task.Task;
import com.taskflow.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DependencyServiceTest {

    @Mock
    private TaskDependencyRepository dependencyRepository;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private DependencyService dependencyService;

    private Task task1;
    private Task task2;
    private Task task3;

    @BeforeEach
    void setUp() {
        task1 = Task.builder().title("Task 1").build();
        task1.setId(1L);

        task2 = Task.builder().title("Task 2").build();
        task2.setId(2L);

        task3 = Task.builder().title("Task 3").build();
        task3.setId(3L);
    }

    @Test
    void addDependency_ShouldThrow_WhenTaskDependsOnItself() {
        assertThrows(IllegalArgumentException.class, () ->
                dependencyService.addDependency(1L, 1L));
    }

    @Test
    void addDependency_ShouldThrow_WhenDependencyAlreadyExists() {
        when(dependencyRepository.existsByTaskIdAndDependsOnId(1L, 2L)).thenReturn(true);

        assertThrows(IllegalStateException.class, () ->
                dependencyService.addDependency(1L, 2L));
    }

    @Test
    void addDependency_ShouldPreventDirectCircularCycle() {
        // If task 2 depends on task 1, adding task 1 depends on task 2 must throw circular error!
        when(dependencyRepository.existsByTaskIdAndDependsOnId(1L, 2L)).thenReturn(false);
        // DFS: when queue processes task 2, it asks what task 2 depends on -> task 1!
        when(dependencyRepository.findByTaskId(2L)).thenReturn(List.of(
                TaskDependency.builder().task(task2).dependsOn(task1).build()
        ));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                dependencyService.addDependency(1L, 2L));

        assertTrue(ex.getMessage().contains("circular dependency"));
        verify(dependencyRepository, never()).save(any());
    }

    @Test
    void addDependency_ShouldPreventIndirectTransitiveCycle() {
        // Chain: Task 3 -> Task 2 -> Task 1.
        // Trying to make Task 1 -> Task 3 would create 1 -> 3 -> 2 -> 1 cycle!
        when(dependencyRepository.existsByTaskIdAndDependsOnId(1L, 3L)).thenReturn(false);

        // Task 3 depends on Task 2
        when(dependencyRepository.findByTaskId(3L)).thenReturn(List.of(
                TaskDependency.builder().task(task3).dependsOn(task2).build()
        ));
        // Task 2 depends on Task 1
        when(dependencyRepository.findByTaskId(2L)).thenReturn(List.of(
                TaskDependency.builder().task(task2).dependsOn(task1).build()
        ));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                dependencyService.addDependency(1L, 3L));

        assertTrue(ex.getMessage().contains("circular dependency"));
        verify(dependencyRepository, never()).save(any());
    }

    @Test
    void addDependency_ShouldSave_WhenValidAndAcyclic() {
        when(dependencyRepository.existsByTaskIdAndDependsOnId(1L, 2L)).thenReturn(false);
        when(dependencyRepository.findByTaskId(2L)).thenReturn(List.of());
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task1));
        when(taskRepository.findById(2L)).thenReturn(Optional.of(task2));

        assertDoesNotThrow(() -> dependencyService.addDependency(1L, 2L));
        verify(dependencyRepository).save(any(TaskDependency.class));
    }
}
