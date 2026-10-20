package com.taskflow.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.activity.TaskActivityRepository;
import com.taskflow.ai.dto.AiTaskDto;
import com.taskflow.ai.dto.GenerateTaskPlanRequest;
import com.taskflow.ai.dto.RiskAnalysisResponse;
import com.taskflow.dependency.TaskDependencyRepository;
import com.taskflow.project.Project;
import com.taskflow.project.ProjectRepository;
import com.taskflow.task.Task;
import com.taskflow.task.TaskMapper;
import com.taskflow.task.TaskRepository;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskDependencyRepository dependencyRepository;

    @Mock
    private TaskActivityRepository activityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private ChatModel chatModel;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AiService aiService;

    private User manager;
    private Project project;

    @BeforeEach
    void setUp() {
        manager = User.builder()
                .name("Manager Bob")
                .email("manager@taskflow.com")
                .role(User.Role.MANAGER)
                .build();
        manager.setId(1L);

        project = Project.builder()
                .name("Core Banking API")
                .description("High-scale banking system")
                .status(Project.Status.ACTIVE)
                .manager(manager)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(20))
                .build();
        project.setId(100L);
    }

    @Test
    void generateTaskPlan_ShouldReturnStructuredPlan_UsingHeuristicFallbackWhenApiKeyMissing() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(project));

        GenerateTaskPlanRequest req = new GenerateTaskPlanRequest();
        req.setProjectDescription("Core banking microservices");
        req.setTechStack("Java 21, Spring Boot 3, React");
        req.setObjectives("Auth, Payments, Dashboard");

        List<AiTaskDto> tasks = aiService.generateTaskPlan(100L, req, "manager@taskflow.com");

        assertNotNull(tasks);
        assertFalse(tasks.isEmpty());
        // Verify heuristic generates comprehensive roles and tasks
        assertTrue(tasks.stream().anyMatch(t -> t.getTitle().contains("Architecture")));
        assertTrue(tasks.stream().anyMatch(t -> t.getSuggestedRole().contains("Engineer") || t.getSuggestedRole().contains("Architect")));
    }

    @Test
    void analyzeProjectRisk_ShouldCalculateTransparentScoreAndIdentifyBlockedTasks() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(project));

        Task blockedTask = Task.builder()
                .title("Database connection pooling")
                .status(Task.Status.BLOCKED)
                .priority(Task.Priority.CRITICAL)
                .build();
        blockedTask.setId(201L);

        Task overdueTask = Task.builder()
                .title("API Gateway setup")
                .status(Task.Status.IN_PROGRESS)
                .priority(Task.Priority.HIGH)
                .dueDate(LocalDate.now().minusDays(3))
                .build();
        overdueTask.setId(202L);

        when(taskRepository.findByProjectId(100L)).thenReturn(List.of(blockedTask, overdueTask));
        when(dependencyRepository.findByTaskId(anyLong())).thenReturn(List.of());

        RiskAnalysisResponse resp = aiService.analyzeProjectRisk(100L, "manager@taskflow.com");

        assertNotNull(resp);
        assertEquals(1, resp.getBlockedTasksCount());
        assertEquals(1, resp.getOverdueTasksCount());
        assertTrue(resp.getRiskScore() > 0);
        assertTrue(resp.getFactors().stream().anyMatch(f -> f.getFactor().contains("Blocked Task")));
        assertTrue(resp.getFactors().stream().anyMatch(f -> f.getFactor().contains("Overdue Task")));
        assertFalse(resp.getRecommendations().isEmpty());
    }
}
