package com.taskflow.comment;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentDto {
    private Long id;
    private Long taskId;
    private Long authorId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
}
