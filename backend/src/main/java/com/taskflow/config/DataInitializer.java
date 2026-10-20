package com.taskflow.config;

import com.taskflow.activity.TaskActivity;
import com.taskflow.activity.TaskActivityRepository;
import com.taskflow.comment.TaskComment;
import com.taskflow.comment.TaskCommentRepository;
import com.taskflow.dependency.TaskDependency;
import com.taskflow.dependency.TaskDependencyRepository;
import com.taskflow.project.Project;
import com.taskflow.project.ProjectRepository;
import com.taskflow.task.Task;
import com.taskflow.task.TaskRepository;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskCommentRepository commentRepository;
    private final TaskActivityRepository activityRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial data creation.");
            return;
        }

        log.info("Seeding initial production-like demo data...");

        // 1. Create Users
        User manager = userRepository.save(User.builder()
                .name("Alex Johnson (Manager)")
                .email("manager@taskflow.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.MANAGER)
                .build());

        User emp1 = userRepository.save(User.builder()
                .name("Sarah Connor")
                .email("alex@taskflow.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.EMPLOYEE)
                .build());

        User emp2 = userRepository.save(User.builder()
                .name("David Miller")
                .email("david@taskflow.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.EMPLOYEE)
                .build());

        User emp3 = userRepository.save(User.builder()
                .name("Elena Rostova")
                .email("elena@taskflow.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(User.Role.EMPLOYEE)
                .build());

        // 2. Create Projects
        Project p1 = projectRepository.save(Project.builder()
                .name("NextGen Mobile Banking Platform")
                .description("Modernize customer-facing retail banking APIs with high-throughput microservices and biometrics authentication.")
                .status(Project.Status.ACTIVE)
                .startDate(LocalDate.now().minusDays(30))
                .endDate(LocalDate.now().plusDays(45))
                .manager(manager)
                .archived(false)
                .build());

        Project p2 = projectRepository.save(Project.builder()
                .name("Cloud Infrastructure Modernization")
                .description("Kubernetes multi-region migration and automated CI/CD pipeline consolidation.")
                .status(Project.Status.PLANNING)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(60))
                .manager(manager)
                .archived(false)
                .build());

        Project p3 = projectRepository.save(Project.builder()
                .name("AI Customer Sentiment Engine")
                .description("Real-time sentiment scoring and analytics pipeline for omnichannel support channels.")
                .status(Project.Status.ACTIVE)
                .startDate(LocalDate.now().minusDays(15))
                .endDate(LocalDate.now().plusDays(5)) // Approaching deadline!
                .manager(manager)
                .archived(false)
                .build());

        // 3. Create Tasks for Project 1
        Task t1 = taskRepository.save(Task.builder()
                .title("Design OAuth2 & Biometrics Security Protocol")
                .description("Specify cryptographic token exchange, refresh policies, and hardware biometrics integration.")
                .status(Task.Status.COMPLETED)
                .priority(Task.Priority.CRITICAL)
                .progress(100)
                .dueDate(LocalDate.now().minusDays(5))
                .project(p1)
                .assignee(emp1)
                .build());

        Task t2 = taskRepository.save(Task.builder()
                .title("Implement Transaction Ledger Microservice")
                .description("Develop double-entry accounting records with ACID transactional guarantees and event sourcing.")
                .status(Task.Status.IN_PROGRESS)
                .priority(Task.Priority.HIGH)
                .progress(65)
                .dueDate(LocalDate.now().plusDays(4))
                .project(p1)
                .assignee(emp1)
                .build());

        Task t3 = taskRepository.save(Task.builder()
                .title("Build Mobile Account Balance & Transfer UI")
                .description("React Native views for instant balance queries and peer-to-peer payments.")
                .status(Task.Status.TODO)
                .priority(Task.Priority.HIGH)
                .progress(0)
                .dueDate(LocalDate.now().plusDays(12))
                .project(p1)
                .assignee(emp2)
                .build());

        Task t4 = taskRepository.save(Task.builder()
                .title("Core Banking Gateway Sandbox Integration")
                .description("Connect to upstream sandbox environment; currently waiting on partner API credentials.")
                .status(Task.Status.BLOCKED)
                .priority(Task.Priority.CRITICAL)
                .progress(20)
                .dueDate(LocalDate.now().minusDays(2)) // Overdue & Blocked!
                .project(p1)
                .assignee(emp3)
                .build());

        // 4. Create Tasks for Project 3 (AI Sentiment Engine)
        Task t5 = taskRepository.save(Task.builder()
                .title("Train Transformer Classification Model")
                .description("Fine-tune BERT model on 50k customer support transcripts.")
                .status(Task.Status.COMPLETED)
                .priority(Task.Priority.HIGH)
                .progress(100)
                .dueDate(LocalDate.now().minusDays(8))
                .project(p3)
                .assignee(emp1)
                .build());

        Task t6 = taskRepository.save(Task.builder()
                .title("Deploy Low-Latency Inference Endpoint")
                .description("Deploy ONNX runtime on GPU nodes with sub-25ms response latency.")
                .status(Task.Status.IN_PROGRESS)
                .priority(Task.Priority.CRITICAL)
                .progress(70)
                .dueDate(LocalDate.now().plusDays(2))
                .project(p3)
                .assignee(emp2)
                .build());

        // 5. Create Task Dependency (t3 depends on t2)
        dependencyRepository.save(TaskDependency.builder()
                .task(t3)
                .dependsOn(t2)
                .build());

        // 6. Comments
        commentRepository.save(TaskComment.builder()
                .task(t4)
                .author(emp3)
                .content("Partner API gateway credentials were not delivered on schedule. Escalated to vendor relationship manager.")
                .build());

        commentRepository.save(TaskComment.builder()
                .task(t2)
                .author(emp1)
                .content("Ledger schema benchmarks passed 12,000 TPS under simulated load testing.")
                .build());

        // 7. Activity Records
        activityRepository.save(TaskActivity.builder()
                .task(t1)
                .actor(emp1)
                .action("STATUS_CHANGED")
                .oldValue("IN_PROGRESS")
                .newValue("COMPLETED")
                .build());

        activityRepository.save(TaskActivity.builder()
                .task(t4)
                .actor(emp3)
                .action("STATUS_CHANGED")
                .oldValue("IN_PROGRESS")
                .newValue("BLOCKED")
                .build());

        log.info("Demo data seeding completed successfully!");
    }
}
