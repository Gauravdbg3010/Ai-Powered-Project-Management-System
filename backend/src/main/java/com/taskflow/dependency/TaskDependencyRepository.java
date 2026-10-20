package com.taskflow.dependency;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskDependencyRepository extends JpaRepository<TaskDependency, Long> {
    List<TaskDependency> findByTaskId(Long taskId);
    List<TaskDependency> findByDependsOnId(Long dependsOnId);
    boolean existsByTaskIdAndDependsOnId(Long taskId, Long dependsOnId);
    void deleteByTaskIdAndDependsOnId(Long taskId, Long dependsOnId);
}
