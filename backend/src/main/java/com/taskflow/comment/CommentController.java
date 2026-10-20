package com.taskflow.comment;

import com.taskflow.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentDto>>> getComments(@PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(commentService.getComments(taskId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CommentDto>> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentDto comment = commentService.addComment(taskId, request.getContent(), userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comment added", comment));
    }
}
