package com.taskflow.user;

import com.taskflow.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/employees")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEmployees() {
        List<Map<String, Object>> employees = userService.findAllEmployees().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail(),
                        "role", u.getRole().name()
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<Map<String, Object>> users = userService.findAll().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail(),
                        "role", u.getRole().name()
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> payload) {
        String roleStr = payload.get("role");
        if (roleStr == null || (!roleStr.equalsIgnoreCase("MANAGER") && !roleStr.equalsIgnoreCase("EMPLOYEE"))) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid role. Must be MANAGER or EMPLOYEE"));
        }
        User.Role role = User.Role.valueOf(roleStr.toUpperCase());
        User user = userService.updateRole(userId, role);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        )));
    }
}
