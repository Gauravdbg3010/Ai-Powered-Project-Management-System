package com.taskflow.activity;

import com.taskflow.task.Task;
import com.taskflow.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_activities")
@Getter
@Setter
@Builder
public class TaskActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public TaskActivity() {}

    public TaskActivity(Long id, Task task, User actor, String action, String oldValue, String newValue, LocalDateTime createdAt) {
        this.id = id;
        this.task = task;
        this.actor = actor;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.createdAt = createdAt;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(nullable = false)
    private String action;

    private String oldValue;
    private String newValue;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { this.createdAt = LocalDateTime.now(); }
}
