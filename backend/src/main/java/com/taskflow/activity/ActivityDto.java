package com.taskflow.activity;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ActivityDto {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private Long actorId;
    private String actorName;
    private String action;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;
}
