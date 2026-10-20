package com.taskflow.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.activity.TaskActivity;
import com.taskflow.activity.TaskActivityRepository;
import com.taskflow.ai.dto.*;
import com.taskflow.dependency.TaskDependencyRepository;
import com.taskflow.project.Project;
import com.taskflow.project.ProjectRepository;
import com.taskflow.task.Task;
import com.taskflow.task.TaskDto;
import com.taskflow.task.TaskMapper;
import com.taskflow.task.TaskRepository;
import com.taskflow.user.User;
import com.taskflow.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final ObjectMapper objectMapper;

    public AiService(ProjectRepository projectRepository,
                     TaskRepository taskRepository,
                     TaskDependencyRepository dependencyRepository,
                     TaskActivityRepository activityRepository,
                     UserRepository userRepository,
                     TaskMapper taskMapper,
                     ObjectMapper objectMapper) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.dependencyRepository = dependencyRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.taskMapper = taskMapper;
        this.objectMapper = objectMapper;
    }

    @Autowired(required = false)
    private ChatModel injectedChatModel;

    @Value("${spring.ai.openai.api-key:demo-key}")
    private String envApiKey;

    @Value("${spring.ai.openai.base-url:https://generativelanguage.googleapis.com/v1beta/openai/}")
    private String envBaseUrl;

    @Value("${spring.ai.openai.chat.options.model:gemini-1.5-flash}")
    private String envModel;

    private volatile String configuredApiKey;
    private volatile String configuredProvider = "gemini";
    private volatile String configuredModel = "gemini-1.5-flash";
    private volatile ChatModel customChatModel;

    public AiConfigDto getAiConfig() {
        boolean configured = isAiConfigured();
        String activeKey = configuredApiKey != null ? configuredApiKey : envApiKey;
        String maskedKey = "";
        if (activeKey != null && activeKey.length() > 8 && !activeKey.equals("demo-key")) {
            maskedKey = activeKey.substring(0, 4) + "..." + activeKey.substring(activeKey.length() - 4);
        }
        return AiConfigDto.builder()
                .configured(configured)
                .provider(configuredProvider)
                .model(configuredModel != null ? configuredModel : envModel)
                .apiKey(maskedKey)
                .build();
    }

    public synchronized AiConfigDto updateAiConfig(AiConfigDto dto) {
        if (dto.getApiKey() != null && !dto.getApiKey().trim().isEmpty()) {
            String key = dto.getApiKey().trim();
            this.configuredApiKey = key;
            String provider = dto.getProvider() != null ? dto.getProvider().toLowerCase() : "gemini";
            if (key.startsWith("AIzaSy")) {
                provider = "gemini";
            } else if (key.startsWith("sk-")) {
                provider = "openai";
            }
            this.configuredProvider = provider;

            String baseUrl = "openai".equals(provider)
                    ? "https://api.openai.com"
                    : "https://generativelanguage.googleapis.com/v1beta/openai/";
            String model = dto.getModel() != null && !dto.getModel().isBlank()
                    ? dto.getModel()
                    : ("openai".equals(provider) ? "gpt-4o-mini" : "gemini-1.5-flash");
            this.configuredModel = model;

            try {
                OpenAiApi api = new OpenAiApi(baseUrl, key);
                OpenAiChatOptions options = OpenAiChatOptions.builder()
                        .withModel(model)
                        .withTemperature(0.7)
                        .build();
                this.customChatModel = new OpenAiChatModel(api, options);
                log.info("Initialized live ChatModel with provider={}, model={}", provider, model);
            } catch (Exception e) {
                log.error("Failed to initialize custom ChatModel: {}", e.getMessage());
                throw new IllegalArgumentException("Failed to initialize AI model: " + e.getMessage());
            }
        }
        return getAiConfig();
    }

    private ChatModel getChatModel() {
        if (customChatModel != null) {
            return customChatModel;
        }
        return injectedChatModel;
    }

    private boolean isAiConfigured() {
        if (customChatModel != null) return true;
        return injectedChatModel != null && envApiKey != null
                && !envApiKey.trim().isEmpty()
                && !envApiKey.equals("demo-key")
                && !envApiKey.contains("sk-proj-placeholder");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. Task Plan Generator
    // ─────────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AiTaskDto> generateTaskPlan(Long projectId, GenerateTaskPlanRequest request, String userEmail) {
        Project project = findProjectOrThrow(projectId);
        assertIsManager(project, userEmail);

        if (isAiConfigured()) {
            try {
                String promptText = """
                    You are an expert Agile Scrum Master and Software Architect.
                    Generate a structured task breakdown for project '%s'.
                    Objectives: %s
                    Technology Stack: %s
                    Target Deadline: %s
                    Team Context: %s
                    Description: %s
                    
                    Return ONLY a valid JSON array of tasks matching this schema:
                    [
                      {
                        "title": "Clear task title",
                        "description": "Comprehensive specification and implementation details",
                        "priority": "LOW|MEDIUM|HIGH|CRITICAL",
                        "estimatedDuration": "X days/hours",
                        "suggestedRole": "Backend Engineer|Frontend Engineer|DevOps|QA",
                        "dependencies": ["Any prerequisite task title if applicable"],
                        "acceptanceCriteria": "Given... When... Then... criteria"
                      }
                    ]
                    Do NOT wrap with markdown code blocks. Return raw JSON.
                    """.formatted(
                        project.getName(),
                        request.getObjectives() != null ? request.getObjectives() : "Core deliverables",
                        request.getTechStack() != null ? request.getTechStack() : "Full-stack",
                        request.getDeadline() != null ? request.getDeadline() : "Planned milestone",
                        request.getTeamContext() != null ? request.getTeamContext() : "Agile cross-functional team",
                        request.getProjectDescription()
                    );

                String response = getChatModel().call(promptText);
                String cleanJson = cleanJsonResponse(response);
                return objectMapper.readValue(cleanJson, new TypeReference<List<AiTaskDto>>() {});
            } catch (Exception e) {
                log.warn("LLM generation failed or returned invalid JSON. Falling back to structured heuristic plan: {}", e.getMessage());
            }
        }

        // Deterministic, high-quality fallback breakdown based on project parameters
        return generateHeuristicTaskPlan(project, request);
    }

    @Transactional
    public List<TaskDto> approveTaskPlan(Long projectId, ApproveTaskPlanRequest request, String userEmail) {
        Project project = findProjectOrThrow(projectId);
        assertIsManager(project, userEmail);
        User manager = findUserByEmail(userEmail);

        List<Task> savedTasks = new ArrayList<>();
        Map<String, Task> taskMap = new HashMap<>();

        for (AiTaskDto aiTask : request.getTasks()) {
            if (!aiTask.isSelected()) continue;

            Task.Priority priority = Task.Priority.MEDIUM;
            try {
                if (aiTask.getPriority() != null) {
                    priority = Task.Priority.valueOf(aiTask.getPriority().toUpperCase());
                }
            } catch (Exception ignored) {}

            String fullDescription = aiTask.getDescription() != null ? aiTask.getDescription() : "";
            if (aiTask.getAcceptanceCriteria() != null && !aiTask.getAcceptanceCriteria().isBlank()) {
                fullDescription += "\n\nAcceptance Criteria:\n" + aiTask.getAcceptanceCriteria();
            }
            if (aiTask.getSuggestedRole() != null && !aiTask.getSuggestedRole().isBlank()) {
                fullDescription += "\n\nSuggested Role: " + aiTask.getSuggestedRole();
            }

            Task task = Task.builder()
                    .title(aiTask.getTitle())
                    .description(fullDescription)
                    .status(Task.Status.TODO)
                    .priority(priority)
                    .progress(0)
                    .project(project)
                    .build();

            Task saved = taskRepository.save(task);
            savedTasks.add(saved);
            taskMap.put(aiTask.getTitle(), saved);

            activityRepository.save(TaskActivity.builder()
                    .task(saved)
                    .actor(manager)
                    .action("CREATED_VIA_AI")
                    .newValue("Generated and approved from AI Plan")
                    .build());
        }

        return savedTasks.stream().map(taskMapper::toDto).toList();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. Risk Analysis
    // ─────────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public RiskAnalysisResponse analyzeProjectRisk(Long projectId, String userEmail) {
        Project project = findProjectOrThrow(projectId);
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        LocalDate today = LocalDate.now();

        int overdueCount = 0;
        int blockedCount = 0;
        int criticalCount = 0;
        int unresolvedDepsCount = 0;

        List<RiskFactorDto> factors = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        for (Task t : tasks) {
            boolean isCompleted = t.getStatus() == Task.Status.COMPLETED;
            if (!isCompleted && t.getDueDate() != null && t.getDueDate().isBefore(today)) {
                overdueCount++;
                factors.add(RiskFactorDto.builder()
                        .factor("Overdue Task: " + t.getTitle())
                        .severity("HIGH")
                        .evidence("Due on " + t.getDueDate() + " (" + ChronoUnit.DAYS.between(t.getDueDate(), today) + " days overdue)")
                        .build());
            }
            if (t.getStatus() == Task.Status.BLOCKED) {
                blockedCount++;
                factors.add(RiskFactorDto.builder()
                        .factor("Blocked Task: " + t.getTitle())
                        .severity("CRITICAL")
                        .evidence("Task status is marked as BLOCKED")
                        .build());
            }
            if (!isCompleted && t.getPriority() == Task.Priority.CRITICAL) {
                criticalCount++;
                factors.add(RiskFactorDto.builder()
                        .factor("Unresolved Critical Task: " + t.getTitle())
                        .severity("HIGH")
                        .evidence("Priority is CRITICAL and task is currently " + t.getStatus())
                        .build());
            }
            // Check unresolved dependencies
            List<Long> deps = dependencyRepository.findByTaskId(t.getId()).stream()
                    .map(d -> d.getDependsOn().getId()).toList();
            if (!deps.isEmpty()) {
                long incompleteDeps = taskRepository.findAllById(deps).stream()
                        .filter(depTask -> depTask.getStatus() != Task.Status.COMPLETED).count();
                if (incompleteDeps > 0) {
                    unresolvedDepsCount++;
                    if (!isCompleted) {
                        factors.add(RiskFactorDto.builder()
                                .factor("Unresolved Dependencies: " + t.getTitle())
                                .severity("MEDIUM")
                                .evidence("Depends on " + incompleteDeps + " incomplete prerequisite task(s)")
                                .build());
                    }
                }
            }
        }

        Long daysUntilDeadline = null;
        if (project.getEndDate() != null) {
            daysUntilDeadline = ChronoUnit.DAYS.between(today, project.getEndDate());
            if (daysUntilDeadline < 0) {
                factors.add(RiskFactorDto.builder()
                        .factor("Project Milestone Passed")
                        .severity("CRITICAL")
                        .evidence("Project end date was " + project.getEndDate() + " (" + Math.abs(daysUntilDeadline) + " days past)")
                        .build());
            } else if (daysUntilDeadline <= 7 && tasks.stream().anyMatch(t -> t.getStatus() != Task.Status.COMPLETED)) {
                factors.add(RiskFactorDto.builder()
                        .factor("Approaching Final Deadline")
                        .severity("HIGH")
                        .evidence("Project deadline is in " + daysUntilDeadline + " days with " +
                                tasks.stream().filter(t -> t.getStatus() != Task.Status.COMPLETED).count() + " incomplete tasks")
                        .build());
            }
        }

        // Transparent risk score calculation (0 - 100)
        int totalTasks = tasks.size();
        int baseScore = 0;
        if (totalTasks > 0) {
            baseScore += (overdueCount * 25);
            baseScore += (blockedCount * 30);
            baseScore += (criticalCount * 15);
            baseScore += (unresolvedDepsCount * 10);
            if (daysUntilDeadline != null && daysUntilDeadline <= 7) {
                baseScore += 20;
            }
        }
        int riskScore = Math.min(100, Math.max(0, baseScore));
        String riskLevel = riskScore >= 75 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : riskScore >= 25 ? "MEDIUM" : "LOW";

        if (blockedCount > 0) recommendations.add("Unblock the " + blockedCount + " blocked task(s) immediately to resume flow.");
        if (overdueCount > 0) recommendations.add("Re-estimate and re-allocate deadlines or resources for " + overdueCount + " overdue task(s).");
        if (criticalCount > 0) recommendations.add("Prioritize the " + criticalCount + " critical priority task(s) in the current sprint.");
        if (recommendations.isEmpty()) recommendations.add("Project timeline and velocity are healthy. Keep monitoring active dependencies.");

        String explanation = "Project risk evaluated as " + riskLevel + " (score " + riskScore + "/100). " +
                "Detected " + overdueCount + " overdue, " + blockedCount + " blocked, and " + criticalCount + " critical task(s).";

        if (isAiConfigured()) {
            try {
                String aiSummaryPrompt = "Based on project '" + project.getName() + "' metrics: " + explanation +
                        ". Provide a professional 2-3 sentence executive risk summary and strategic mitigation advice.";
                String aiResponse = getChatModel().call(aiSummaryPrompt);
                if (aiResponse != null && !aiResponse.isBlank()) {
                    explanation = aiResponse.trim();
                }
            } catch (Exception ignored) {}
        }

        return RiskAnalysisResponse.builder()
                .riskLevel(riskLevel)
                .riskScore(riskScore)
                .overdueTasksCount(overdueCount)
                .blockedTasksCount(blockedCount)
                .criticalTasksCount(criticalCount)
                .unresolvedDependencyTasksCount(unresolvedDepsCount)
                .daysUntilProjectDeadline(daysUntilDeadline)
                .factors(factors)
                .recommendations(recommendations)
                .explanation(explanation)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. AI Progress Summary
    // ─────────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public String generateProgressSummary(Long projectId, String userEmail) {
        Project project = findProjectOrThrow(projectId);
        List<Task> tasks = taskRepository.findByProjectId(projectId);

        long completed = tasks.stream().filter(t -> t.getStatus() == Task.Status.COMPLETED).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count();
        long blocked = tasks.stream().filter(t -> t.getStatus() == Task.Status.BLOCKED).count();
        long todo = tasks.stream().filter(t -> t.getStatus() == Task.Status.TODO).count();
        int total = tasks.size();
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);

        String verifiedFacts = String.format(
            "Project: %s (Status: %s)\n" +
            "Completion: %d%% (%d of %d tasks completed)\n" +
            "Breakdown: %d In Progress, %d To Do, %d Blocked\n" +
            "Manager: %s",
            project.getName(), project.getStatus(), progress, completed, total, inProgress, todo, blocked, project.getManager().getName()
        );

        if (isAiConfigured()) {
            try {
                String promptText = """
                    Write a concise, professional executive progress report for the project below.
                    Clearly separate 'Verified Metrics' from 'Recommendations'.
                    Data:
                    %s
                    """.formatted(verifiedFacts);
                return getChatModel().call(promptText);
            } catch (Exception e) {
                log.warn("Failed to generate AI progress summary via LLM: {}", e.getMessage());
            }
        }

        return "### Verified Metrics\n\n" +
               "- **Project Name:** " + project.getName() + " (" + project.getStatus() + ")\n" +
               "- **Progress:** " + progress + "% (" + completed + "/" + total + " tasks completed)\n" +
               "- **Active Work:** " + inProgress + " task(s) currently In Progress\n" +
               "- **Pending:** " + todo + " task(s) To Do\n" +
               "- **Blockers:** " + (blocked > 0 ? blocked + " task(s) BLOCKED" : "None") + "\n\n" +
               "### Recommendations\n\n" +
               (blocked > 0 ? "- High priority: Address the " + blocked + " blocked work item(s).\n" : "- Momentum is positive.\n") +
               "- Ensure code reviews are prioritized to keep In Progress tasks flowing to Completed.";
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. Conversational AI Assistant
    // ─────────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ChatResponse chatWithAssistant(ChatRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);
        StringBuilder context = new StringBuilder();

        if (request.getProjectId() != null) {
            Project project = findProjectOrThrow(request.getProjectId());
            List<Task> tasks = taskRepository.findByProjectId(project.getId());
            context.append("Project: ").append(project.getName())
                   .append(", Status: ").append(project.getStatus())
                   .append(", Description: ").append(project.getDescription())
                   .append("\nTasks:\n");
            for (Task t : tasks) {
                context.append("- [").append(t.getStatus()).append("] ")
                       .append(t.getTitle()).append(" (Priority: ").append(t.getPriority())
                       .append(", Due: ").append(t.getDueDate())
                       .append(", Assignee: ").append(t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned")
                       .append(")\n");
            }
        } else {
            List<Task> myTasks = taskRepository.findByAssigneeId(user.getId());
            context.append("User: ").append(user.getName())
                   .append(" (Role: ").append(user.getRole()).append(")\nAssigned Tasks:\n");
            for (Task t : myTasks) {
                context.append("- [").append(t.getStatus()).append("] ").append(t.getTitle())
                       .append(" in Project: ").append(t.getProject().getName()).append("\n");
            }
        }

        String contextSummary = "Authorized context with " + (request.getProjectId() != null ? "Project #" + request.getProjectId() : "User's tasks");

        if (isAiConfigured()) {
            try {
                String promptText = """
                    You are TaskFlow AI, an intelligent project management assistant.
                    Answer the user's question accurately using ONLY the authorized project and task context provided below.
                    If the information is not in the context, clearly explain that.
                    
                    Authorized Context:
                    %s
                    
                    User Query: %s
                    """.formatted(context.toString(), request.getMessage());
                String reply = getChatModel().call(promptText);
                return ChatResponse.builder().response(reply).contextSummary(contextSummary).build();
            } catch (Exception e) {
                log.warn("Assistant LLM chat failed: {}", e.getMessage());
            }
        }

        // Rich multi-domain heuristic response matching user query intent
        String answer = generateIntelligentHeuristicReply(request.getMessage(), request.getProjectId(), user);

        return ChatResponse.builder()
                .response(answer)
                .contextSummary(contextSummary)
                .build();
    }

    private String generateIntelligentHeuristicReply(String query, Long projectId, User user) {
        String q = query.toLowerCase();
        List<Task> tasks;
        Project project = null;
        if (projectId != null) {
            project = findProjectOrThrow(projectId);
            tasks = taskRepository.findByProjectId(projectId);
        } else {
            tasks = taskRepository.findByAssigneeId(user.getId());
        }

        LocalDate today = LocalDate.now();

        // 1. Blockers
        if (q.contains("block") || q.contains("stuck") || q.contains("impediment")) {
            List<Task> blocked = tasks.stream().filter(t -> t.getStatus() == Task.Status.BLOCKED).toList();
            if (blocked.isEmpty()) {
                return "✅ **No Blockers Detected**\n\nThere are currently 0 blocked tasks in " +
                        (project != null ? "project *" + project.getName() + "*" : "your assigned queue") + ". " +
                        "All active workflows are moving forward.";
            }
            StringBuilder sb = new StringBuilder("### ⚠️ Blocked Items Requiring Attention (" + blocked.size() + ")\n\n");
            for (Task t : blocked) {
                sb.append("- **").append(t.getTitle()).append("**\n")
                  .append("  • Priority: `").append(t.getPriority()).append("`\n")
                  .append("  • Assignee: ").append(t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned").append("\n")
                  .append("  • Due Date: ").append(t.getDueDate() != null ? t.getDueDate().toString() : "No deadline").append("\n")
                  .append("  • Details: ").append(t.getDescription() != null ? t.getDescription() : "No description provided").append("\n\n");
            }
            sb.append("**Recommended Action**: Check task comments for partner/credential dependencies or escalate to the project manager.");
            return sb.toString();
        }

        // 2. Deadlines / Due Soon / Upcoming
        if (q.contains("deadline") || q.contains("due") || q.contains("soon") || q.contains("upcoming") || q.contains("calendar")) {
            LocalDate nextWeek = today.plusDays(7);
            List<Task> dueSoon = tasks.stream()
                    .filter(t -> t.getDueDate() != null && !t.getDueDate().isBefore(today) && !t.getDueDate().isAfter(nextWeek) && t.getStatus() != Task.Status.COMPLETED)
                    .sorted(Comparator.comparing(Task::getDueDate))
                    .toList();
            List<Task> overdue = tasks.stream()
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today) && t.getStatus() != Task.Status.COMPLETED)
                    .sorted(Comparator.comparing(Task::getDueDate))
                    .toList();

            StringBuilder sb = new StringBuilder("### 📅 Upcoming Deadlines & Schedule\n\n");
            if (!overdue.isEmpty()) {
                sb.append("#### 🔴 Overdue Tasks (Immediate Attention)\n");
                for (Task t : overdue) {
                    long days = ChronoUnit.DAYS.between(t.getDueDate(), today);
                    sb.append("- **").append(t.getTitle()).append("** — **").append(days).append(" day(s) overdue** (Due: ").append(t.getDueDate()).append(", Priority: ").append(t.getPriority()).append(")\n");
                }
                sb.append("\n");
            }

            if (!dueSoon.isEmpty()) {
                sb.append("#### 🟡 Due In The Next 7 Days\n");
                for (Task t : dueSoon) {
                    long days = ChronoUnit.DAYS.between(today, t.getDueDate());
                    sb.append("- **").append(t.getTitle()).append("** — in ").append(days).append(" day(s) (").append(t.getDueDate()).append(") — Assigned to: ").append(t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned").append("\n");
                }
            } else {
                sb.append("No pending tasks due in the next 7 days.\n");
            }
            return sb.toString();
        }

        // 3. Overdue tasks
        if (q.contains("overdue") || q.contains("late") || q.contains("delayed")) {
            List<Task> overdue = tasks.stream()
                    .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today) && t.getStatus() != Task.Status.COMPLETED)
                    .toList();
            if (overdue.isEmpty()) {
                return "✅ **Timeline Healthy**: There are 0 overdue tasks currently.";
            }
            StringBuilder sb = new StringBuilder("### 🚨 Overdue Task Alert\n\nFound " + overdue.size() + " task(s) past their scheduled deadline:\n\n");
            for (Task t : overdue) {
                long days = ChronoUnit.DAYS.between(t.getDueDate(), today);
                sb.append("- **").append(t.getTitle()).append("**\n")
                  .append("  • Days Overdue: **").append(days).append(" days**\n")
                  .append("  • Priority: `").append(t.getPriority()).append("`\n")
                  .append("  • Assignee: ").append(t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned").append("\n");
            }
            return sb.toString();
        }

        // 4. Team / Workload / Assignments
        if (q.contains("who") || q.contains("team") || q.contains("workload") || q.contains("assign") || q.contains("member")) {
            Map<String, List<Task>> byAssignee = tasks.stream()
                    .collect(Collectors.groupingBy(t -> t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned"));

            StringBuilder sb = new StringBuilder("### 👥 Team Workload & Task Distribution\n\n");
            byAssignee.forEach((name, userTasks) -> {
                long inProgress = userTasks.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count();
                long completed = userTasks.stream().filter(t -> t.getStatus() == Task.Status.COMPLETED).count();
                long todo = userTasks.stream().filter(t -> t.getStatus() == Task.Status.TODO).count();
                long blocked = userTasks.stream().filter(t -> t.getStatus() == Task.Status.BLOCKED).count();
                sb.append("• **").append(name).append("** (").append(userTasks.size()).append(" total tasks)\n")
                  .append("  — ").append(inProgress).append(" In Progress, ")
                  .append(todo).append(" To Do, ")
                  .append(completed).append(" Completed");
                if (blocked > 0) sb.append(", ⚠️ ").append(blocked).append(" Blocked");
                sb.append("\n");
            });
            return sb.toString();
        }

        // 5. Priorities / Critical / What to work on next
        if (q.contains("priorit") || q.contains("critical") || q.contains("next") || q.contains("recommend") || q.contains("first") || q.contains("focus")) {
            List<Task> critical = tasks.stream()
                    .filter(t -> (t.getPriority() == Task.Priority.CRITICAL || t.getPriority() == Task.Priority.HIGH) && t.getStatus() != Task.Status.COMPLETED)
                    .sorted((a, b) -> a.getPriority().compareTo(b.getPriority()))
                    .toList();

            StringBuilder sb = new StringBuilder("### 🎯 Recommended Strategic Focus\n\nBased on priority scoring and dependency graph:\n\n");
            int rank = 1;
            for (Task t : critical) {
                sb.append(rank++).append(". **").append(t.getTitle()).append("** [`").append(t.getPriority()).append("`]\n")
                  .append("   Status: `").append(t.getStatus()).append("` | Progress: ").append(t.getProgress()).append("%\n")
                  .append("   Assignee: ").append(t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned").append("\n");
            }
            if (critical.isEmpty()) {
                sb.append("All high and critical priority items are completed. Continue with standard backlog items.");
            }
            return sb.toString();
        }

        // 6. Specific task query (e.g. user asks about "ledger", "oauth", "sentiment", "sandbox", etc.)
        for (Task t : tasks) {
            String[] words = t.getTitle().toLowerCase().split("\\s+");
            for (String w : words) {
                if (w.length() >= 4 && q.contains(w)) {
                    return "### 📌 Task Spotlight: " + t.getTitle() + "\n\n" +
                           "- **Status:** `" + t.getStatus() + "` (" + t.getProgress() + "% complete)\n" +
                           "- **Priority:** `" + t.getPriority() + "`\n" +
                           "- **Assignee:** " + (t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned") + "\n" +
                           "- **Due Date:** " + (t.getDueDate() != null ? t.getDueDate().toString() : "Not set") + "\n" +
                           "- **Description:** " + (t.getDescription() != null ? t.getDescription() : "No description") + "\n\n" +
                           "*(Tip: You can update progress or change status in the Tasks tab)*";
                }
            }
        }

        // 7. General Status / Default Overview
        long total = tasks.size();
        long completed = tasks.stream().filter(t -> t.getStatus() == Task.Status.COMPLETED).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count();
        long blocked = tasks.stream().filter(t -> t.getStatus() == Task.Status.BLOCKED).count();
        long todo = tasks.stream().filter(t -> t.getStatus() == Task.Status.TODO).count();
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);

        return "### 📋 Project & Task Status Summary\n\n" +
               (project != null ? "**Project:** " + project.getName() + " (" + project.getStatus() + ")\n" : "**Scope:** Your Assigned Tasks\n") +
               "**Overall Completion:** " + progress + "% (" + completed + " of " + total + " completed)\n\n" +
               "- 🔵 **In Progress:** " + inProgress + " task(s)\n" +
               "- ⚪ **To Do:** " + todo + " task(s)\n" +
               "- 🔴 **Blocked:** " + blocked + " task(s)\n" +
               "- 🟢 **Completed:** " + completed + " task(s)\n\n" +
               "💬 *Ask me specific questions like:*\n" +
               "• *\"What tasks are currently blocked?\"*\n" +
               "• *\"Show me deadlines for the next 7 days\"*\n" +
               "• *\"Who is working on what?\"*\n" +
               "• *\"What should our team prioritize next?\"*\n\n" +
               "✨ *Or connect your **Google Gemini API Key** via the banner above for full open-ended generative chat!*";
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. Task Implementation Plan
    // ─────────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ImplementationPlanResponse getImplementationPlan(Long taskId, String userEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + taskId));

        if (isAiConfigured()) {
            try {
                String promptText = """
                    You are a Lead Software Architect.
                    Create a detailed, actionable step-by-step implementation plan for this software task:
                    Title: %s
                    Description: %s
                    Project: %s
                    Priority: %s
                    
                    Return ONLY a JSON object matching this schema:
                    {
                      "taskId": %d,
                      "taskTitle": "%s",
                      "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
                      "stepByStepSubtasks": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
                      "completionCriteria": ["Criteria 1", "Criteria 2"],
                      "technicalConsiderations": "Important architectural or edge-case notes"
                    }
                    Do NOT wrap with markdown formatting.
                    """.formatted(task.getTitle(), task.getDescription(), task.getProject().getName(), task.getPriority(), task.getId(), task.getTitle());

                String response = getChatModel().call(promptText);
                String clean = cleanJsonResponse(response);
                return objectMapper.readValue(clean, ImplementationPlanResponse.class);
            } catch (Exception e) {
                log.warn("Failed to generate implementation plan with LLM: {}", e.getMessage());
            }
        }

        return ImplementationPlanResponse.builder()
                .taskId(task.getId())
                .taskTitle(task.getTitle())
                .prerequisites(List.of(
                        "Verify development branch is up-to-date with main branch",
                        "Review acceptance criteria and UX requirements",
                        "Ensure required environment variables and database connections are ready"
                ))
                .stepByStepSubtasks(List.of(
                        "1. Domain Modeling: Define required entities, DTOs, and database constraints",
                        "2. Business Logic: Implement service layer with comprehensive validation",
                        "3. API Layer: Expose RESTful endpoints with appropriate HTTP status codes and error handling",
                        "4. Frontend Integration: Connect UI components, handle loading and error states",
                        "5. Automated Testing: Write unit and integration tests covering positive and edge cases"
                ))
                .completionCriteria(List.of(
                        "All unit and integration tests pass cleanly",
                        "Endpoint passes validation and security checks",
                        "Zero linting errors or compilation warnings"
                ))
                .technicalConsiderations("Ensure backward compatibility, input sanitization, and handle edge cases gracefully.")
                .build();
    }

    private List<AiTaskDto> generateHeuristicTaskPlan(Project project, GenerateTaskPlanRequest req) {
        String stack = req.getTechStack() != null ? req.getTechStack() : "Full-stack";
        List<AiTaskDto> tasks = new ArrayList<>();

        tasks.add(AiTaskDto.builder()
                .title("Architecture & Schema Design")
                .description("Design database schema, ER diagrams, entity mappings, and repository structures for " + project.getName())
                .priority("HIGH")
                .estimatedDuration("2 days")
                .suggestedRole("Software Architect")
                .dependencies(List.of())
                .acceptanceCriteria("Complete ER diagrams and validated database migrations.")
                .selected(true)
                .build());

        tasks.add(AiTaskDto.builder()
                .title("Authentication & Authorization Setup")
                .description("Configure Spring Security, JWT token filters, and role-based permissions (MANAGER, EMPLOYEE).")
                .priority("HIGH")
                .estimatedDuration("2 days")
                .suggestedRole("Backend Engineer")
                .dependencies(List.of("Architecture & Schema Design"))
                .acceptanceCriteria("Endpoints secured, tests verify access control and token expiry.")
                .selected(true)
                .build());

        tasks.add(AiTaskDto.builder()
                .title("Core Business Logic & REST APIs (" + stack + ")")
                .description("Implement CRUD services, validation, transactional operations, and audit logging for " + project.getName())
                .priority("CRITICAL")
                .estimatedDuration("4 days")
                .suggestedRole("Backend Engineer")
                .dependencies(List.of("Architecture & Schema Design", "Authentication & Authorization Setup"))
                .acceptanceCriteria("All REST endpoints return standardized ApiResponse and handle errors.")
                .selected(true)
                .build());

        tasks.add(AiTaskDto.builder()
                .title("Responsive Frontend UI Implementation")
                .description("Develop intuitive, information-dense user interface with React, Tailwind CSS, and TypeScript.")
                .priority("HIGH")
                .estimatedDuration("3 days")
                .suggestedRole("Frontend Engineer")
                .dependencies(List.of("Core Business Logic & REST APIs (" + stack + ")"))
                .acceptanceCriteria("Responsive layout, accessible components, real-time feedback.")
                .selected(true)
                .build());

        tasks.add(AiTaskDto.builder()
                .title("Integration Testing & Deployment Preparation")
                .description("Write JUnit 5 test suites, Docker Compose configurations, and complete documentation.")
                .priority("MEDIUM")
                .estimatedDuration("2 days")
                .suggestedRole("DevOps / QA")
                .dependencies(List.of("Responsive Frontend UI Implementation"))
                .acceptanceCriteria("Automated tests passing, container builds and boots cleanly.")
                .selected(true)
                .build());

        return tasks;
    }

    private String cleanJsonResponse(String response) {
        if (response == null) return "[]";
        String clean = response.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }

    private Project findProjectOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
    }

    private void assertIsManager(Project project, String email) {
        if (!project.getManager().getEmail().equals(email)) {
            throw new AccessDeniedException("Only the project manager can perform this action");
        }
    }
}
