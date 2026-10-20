package com.taskflow.comment;

import com.taskflow.task.Task;
import com.taskflow.task.TaskRepository;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final TaskCommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentDto> getComments(Long taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public CommentDto addComment(Long taskId, String content, String authorEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found: " + taskId));
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + authorEmail));

        TaskComment comment = TaskComment.builder()
                .task(task)
                .author(author)
                .content(content)
                .build();
        return toDto(commentRepository.save(comment));
    }

    private CommentDto toDto(TaskComment c) {
        return CommentDto.builder()
                .id(c.getId())
                .taskId(c.getTask().getId())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().getName())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
