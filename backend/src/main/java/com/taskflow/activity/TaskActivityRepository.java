package com.taskflow.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {
    List<TaskActivity> findByTaskIdOrderByCreatedAtDesc(Long taskId);
    List<TaskActivity> findTop10ByTaskProjectIdOrderByCreatedAtDesc(Long projectId);
}
