package com.taskflow.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssigneeId(Long assigneeId);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :userId AND t.dueDate < :today AND t.status != 'COMPLETED'")
    List<Task> findOverdueTasksForUser(@Param("userId") Long userId, @Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.dueDate < :today AND t.status != 'COMPLETED'")
    List<Task> findAllOverdueTasks(@Param("today") LocalDate today);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, Task.Status status);

    long countByAssigneeIdAndStatus(Long assigneeId, Task.Status status);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.dueDate BETWEEN :today AND :soon")
    List<Task> findUpcomingDeadlines(@Param("projectId") Long projectId, @Param("today") LocalDate today, @Param("soon") LocalDate soon);
}
