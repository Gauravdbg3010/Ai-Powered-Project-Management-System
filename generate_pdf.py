import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, letter[1] - 36, "TaskFlow — AI-Powered Project & Task Management System")
            self.drawRightString(letter[0] - 54, letter[1] - 36, "Comprehensive Technical & Architectural Overview")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Footer
        footer_text = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(letter[0] - 54, 30, footer_text)
        self.drawString(54, 30, "Confidential — Engineering Documentation & Tech Stack Guide")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 42, letter[0] - 54, 42)

        self.restoreState()

def create_overview_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1e293b")
    indigo_color = colors.HexColor("#4338ca")
    text_color = colors.HexColor("#334155")
    muted_color = colors.HexColor("#64748b")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=indigo_color,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=indigo_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=text_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_color,
        leftIndent=15,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=text_color
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=primary_color
    )

    story = []

    # Title Block
    story.append(Paragraph("TaskFlow — AI Project & Task Management", title_style))
    story.append(Paragraph("Complete Technical Architecture, Stack Breakdown & User Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=indigo_color, spaceAfter=14))

    # Executive Summary
    story.append(Paragraph("1. Executive Summary & Purpose", h1_style))
    story.append(Paragraph(
        "<b>TaskFlow</b> is an enterprise-grade, information-dense SaaS software platform engineered for modern software teams. "
        "It provides full-lifecycle project planning, task management, team workload tracking, and automated Artificial Intelligence "
        "features that solve everyday bottlenecks.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Design Philosophy:</b> Inspired by tools like <i>Linear</i> and <i>Jira</i>, TaskFlow avoids flashy decorative effects, "
        "cluttered animations, and generic AI templates. Instead, it prioritizes a clean 8-point grid, soft neutral surfaces, "
        "clear typography, high information density, and strict role-based data isolation.",
        body_style
    ))

    # Tech Stack Deep Dive Table
    story.append(Spacer(1, 8))
    story.append(Paragraph("2. Complete Technology Stack & Rationale", h1_style))
    story.append(Paragraph(
        "Every technology in the TaskFlow stack was chosen intentionally for performance, maintainability, type safety, and production readiness.",
        body_style
    ))

    stack_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technology", table_header_style), Paragraph("Version", table_header_style), Paragraph("Simple English Explanation & Why Chosen", table_header_style)],
        
        [Paragraph("Frontend UI", table_cell_bold), Paragraph("React + TypeScript", table_cell_style), Paragraph("React 18<br/>TS 5.6", table_cell_style), 
         Paragraph("<b>React</b> renders dynamic, interactive web interfaces. <b>TypeScript</b> adds static types to prevent bugs before code ever runs in the browser.", table_cell_style)],
        
        [Paragraph("Build Tool", table_cell_bold), Paragraph("Vite", table_cell_style), Paragraph("5.4", table_cell_style), 
         Paragraph("Next-generation build tool with instant Hot Module Replacement (HMR) and optimized rollup production bundles.", table_cell_style)],
        
        [Paragraph("Styling", table_cell_bold), Paragraph("Tailwind CSS", table_cell_style), Paragraph("3.4", table_cell_style), 
         Paragraph("Utility-first styling for a clean design token system (colors, borders, typography, 8-point spacing) without CSS bloat.", table_cell_style)],
        
        [Paragraph("Visuals", table_cell_bold), Paragraph("Lucide React + Recharts", table_cell_style), Paragraph("Latest", table_cell_style), 
         Paragraph("Accessible, modern SVG icons and purposeful data visualizations (burndown, completion rates, workload distribution).", table_cell_style)],
        
        [Paragraph("Backend Core", table_cell_bold), Paragraph("Java + Spring Boot", table_cell_style), Paragraph("Java 21<br/>Boot 3.3.4", table_cell_style), 
         Paragraph("<b>Java 21 LTS</b> provides top performance and stability. <b>Spring Boot</b> provides an enterprise modular architecture with auto-configured web servers.", table_cell_style)],
        
        [Paragraph("Database ORM", table_cell_bold), Paragraph("Spring Data JPA / Hibernate", table_cell_style), Paragraph("6.5", table_cell_style), 
         Paragraph("Maps Java domain models to database tables and handles database queries safely without manual error-prone SQL.", table_cell_style)],
        
        [Paragraph("Security", table_cell_bold), Paragraph("Spring Security + JWT", table_cell_style), Paragraph("JJWT 0.12", table_cell_style), 
         Paragraph("Stateless JSON Web Tokens with HMAC cryptography. Role-based access control protecting all REST endpoints.", table_cell_style)],
        
        [Paragraph("Password Hash", table_cell_bold), Paragraph("BCrypt", table_cell_style), Paragraph("Strength 12", table_cell_style), 
         Paragraph("Adaptive cryptographic one-way hashing with automatic salting to guard user credentials against database leaks.", table_cell_style)],
        
        [Paragraph("Database", table_cell_bold), Paragraph("MySQL 8.0 / H2 Memory", table_cell_style), Paragraph("MySQL 8<br/>H2 Mem", table_cell_style), 
         Paragraph("<b>MySQL</b> for persistent ACID production storage. <b>H2</b> in-memory database profile for zero-config instant local execution.", table_cell_style)],
        
        [Paragraph("AI Engine", table_cell_bold), Paragraph("Spring AI + Google Gemini", table_cell_style), Paragraph("1.0.0-M3<br/>Gemini 1.5", table_cell_style), 
         Paragraph("<b>Spring AI</b> integrates LLMs with automated fallback heuristics. <b>Google Gemini</b> handles live task generation and assistant chat.", table_cell_style)],

        [Paragraph("API Docs", table_cell_bold), Paragraph("SpringDoc OpenAPI", table_cell_style), Paragraph("2.6.0", table_cell_style), 
         Paragraph("Auto-generates interactive Swagger UI documentation at <code>/swagger-ui.html</code> for testing every REST endpoint.", table_cell_style)],
    ]

    stack_table = Table(stack_data, colWidths=[65, 95, 55, 289])
    stack_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), indigo_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(stack_table)

    story.append(PageBreak())

    # Software Architecture
    story.append(Paragraph("3. Modular Backend Architecture", h1_style))
    story.append(Paragraph(
        "The backend follows a <b>clean modular monolith pattern</b>. Each functional area is isolated into its own package "
        "with strict separation between presentation, business logic, and data access layers:",
        body_style
    ))

    arch_points = [
        "<b>Controller Layer (@RestController):</b> Handles incoming HTTP requests, validates request payloads with Jakarta validation, enforces role permissions, and returns standardized <code>ApiResponse&lt;T&gt;</code>.",
        "<b>Service Layer (@Service):</b> Houses all business rules, authorization assertions, circular dependency checks, and audit logging within <code>@Transactional</code> boundaries.",
        "<b>Repository Layer (@Repository):</b> Extends Spring Data JPA interfaces, providing indexed queries, pagination, and sorting.",
        "<b>Entity Layer (@Entity):</b> Defines relational schemas, constraints, foreign keys, and automatic timestamp auditing (<code>createdAt</code>, <code>updatedAt</code>).",
        "<b>DTO Layer:</b> Isolates database entities from external network contracts to prevent data leakage and decouple schema evolution from the frontend.",
        "<b>Global Exception Handler:</b> Intercepts all validation, security, and runtime errors, returning user-friendly error maps with accurate HTTP status codes (400, 401, 403, 404, 500).",
    ]
    for pt in arch_points:
        story.append(Paragraph(f"• {pt}", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("4. Directed Acyclic Graph (DAG) Task Dependencies", h1_style))
    story.append(Paragraph(
        "In complex engineering projects, tasks frequently depend on prerequisite tasks (e.g., UI implementation cannot begin before API endpoints are finished). "
        "TaskFlow models task dependencies as a <b>Directed Acyclic Graph (DAG)</b>. Before any new dependency link (A &rarr; B) is saved:",
        body_style
    ))
    story.append(Paragraph(
        "• The system executes a <b>cycle detection algorithm (Breadth-First Search / Depth-First Search)</b> to verify whether B can already reach A through existing links.<br/>"
        "• If adding the link would create a circular loop (A &rarr; B &rarr; C &rarr; A), the transaction is immediately rejected with a <code>400 Bad Request</code> and a clear explanatory message.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("5. The Five Real-World AI Capabilities", h1_style))
    story.append(Paragraph(
        "Rather than a gimmicky chatbot, TaskFlow incorporates Artificial Intelligence directly into core project management workflows:",
        body_style
    ))

    ai_features = [
        ("1. AI Task Plan Generator", 
         "The project manager inputs project objectives, technology stack, target deadline, and team context. The AI generates a structured, estimated task breakdown including title, technical description, estimated duration, suggested developer role, prerequisite dependencies, and Given/When/Then acceptance criteria."),
        
        ("2. Human-in-the-Loop Review & Approval", 
         "AI suggestions are NEVER saved directly to the database. Instead, they are presented in a reviewable, editable table where the manager can modify estimates, uncheck unwanted tasks, and click 'Approve & Create Tasks' to commit them to the sprint."),
        
        ("3. Transparent Project Risk Analysis", 
         "Analyzes real project metrics—such as overdue tasks, blocked items, critical tasks near deadlines, and incomplete prerequisites. It calculates an explainable risk score (0–100) and provides actionable recommendations to get the project back on track."),
        
        ("4. Executive Progress Summary", 
         "Distinguishes verified database facts (e.g., 40% complete, 1 blocked, 2 in progress) from AI recommendations, giving leadership a quick, hallucination-free project report."),
        
        ("5. Task Implementation Plan Generator", 
         "Developers can click 'Generate Plan' on any task to receive an architectural step-by-step roadmap, including required environment prerequisites, subtask phases, testing strategies, and completion criteria."),
    ]

    for title, desc in ai_features:
        story.append(Paragraph(f"<b>{title}:</b> {desc}", body_style))

    story.append(Spacer(1, 8))
    # Callout Box for Dual Mode
    callout_data = [[
        Paragraph(
            "<b>Dual-Mode AI Engine:</b> TaskFlow is equipped with a dual-mode engine. When an API key is connected (Google Gemini or OpenAI), "
            "it generates rich, generative text. When running offline or without an API key, the proprietary Heuristic Fallback Engine takes over, "
            "providing accurate, structured answers from local database records without failing.",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, indigo_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(callout_table)

    story.append(PageBreak())

    # Database Schema
    story.append(Paragraph("6. Relational Database Schema & Entities", h1_style))
    story.append(Paragraph(
        "The relational database schema is normalized with primary keys, foreign keys, unique constraints, and audit columns:",
        body_style
    ))

    schema_data = [
        [Paragraph("Entity", table_header_style), Paragraph("Table Name", table_header_style), Paragraph("Key Columns", table_header_style), Paragraph("Relationships & Constraints", table_header_style)],
        [Paragraph("User", table_cell_bold), Paragraph("<code>users</code>", table_cell_style), 
         Paragraph("id, email, password_hash, role, name", table_cell_style), 
         Paragraph("Unique constraint on <code>email</code>. Roles: MANAGER, EMPLOYEE.", table_cell_style)],
        [Paragraph("Project", table_cell_bold), Paragraph("<code>projects</code>", table_cell_style), 
         Paragraph("id, name, description, status, start_date, end_date, manager_id, archived", table_cell_style), 
         Paragraph("Many-to-One with <code>users</code> (manager_id). Status: PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED.", table_cell_style)],
        [Paragraph("Task", table_cell_bold), Paragraph("<code>tasks</code>", table_cell_style), 
         Paragraph("id, title, description, status, priority, progress, due_date, project_id, assignee_id", table_cell_style), 
         Paragraph("Many-to-One with <code>projects</code> and <code>users</code>. Status: TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED. Priority: LOW, MEDIUM, HIGH, CRITICAL.", table_cell_style)],
        [Paragraph("Task Dependency", table_cell_bold), Paragraph("<code>task_dependencies</code>", table_cell_style), 
         Paragraph("id, task_id, depends_on_id, created_at", table_cell_style), 
         Paragraph("Self-referencing Many-to-One on <code>tasks</code>. Unique constraint on <code>(task_id, depends_on_id)</code>.", table_cell_style)],
        [Paragraph("Task Comment", table_cell_bold), Paragraph("<code>task_comments</code>", table_cell_style), 
         Paragraph("id, task_id, author_id, content, created_at", table_cell_style), 
         Paragraph("Threaded comments linked to tasks and user authors.", table_cell_style)],
        [Paragraph("Task Activity", table_cell_bold), Paragraph("<code>task_activities</code>", table_cell_style), 
         Paragraph("id, task_id, actor_id, action, old_value, new_value, created_at", table_cell_style), 
         Paragraph("Immutable audit log capturing status transitions, progress edits, and AI creations.", table_cell_style)],
    ]

    schema_table = Table(schema_data, colWidths=[80, 85, 160, 179])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(schema_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph("7. Role-Based Access Control (RBAC) Matrix", h1_style))
    story.append(Paragraph(
        "Security is enforced at the controller method level via <code>@PreAuthorize</code> annotations:",
        body_style
    ))

    rbac_data = [
        [Paragraph("Capability / Operation", table_header_style), Paragraph("Project Manager (MANAGER)", table_header_style), Paragraph("Team Member (EMPLOYEE)", table_header_style)],
        [Paragraph("View Dashboard & Assigned Work", table_cell_bold), Paragraph("Full workspace overview", table_cell_style), Paragraph("Personal assigned tasks & deadlines", table_cell_style)],
        [Paragraph("Create / Edit / Archive Projects", table_cell_bold), Paragraph("Allowed (Full CRUD)", table_cell_style), Paragraph("Read-only access", table_cell_style)],
        [Paragraph("Create / Delete Tasks", table_cell_bold), Paragraph("Allowed for managed projects", table_cell_style), Paragraph("Denied (403 Forbidden)", table_cell_style)],
        [Paragraph("Update Task Status & Progress", table_cell_bold), Paragraph("Allowed", table_cell_style), Paragraph("Allowed only for assigned tasks", table_cell_style)],
        [Paragraph("Manage Task Dependencies", table_cell_bold), Paragraph("Allowed", table_cell_style), Paragraph("Denied", table_cell_style)],
        [Paragraph("Generate & Approve AI Task Plans", table_cell_bold), Paragraph("Allowed", table_cell_style), Paragraph("Denied", table_cell_style)],
        [Paragraph("Generate Task Implementation Plan", table_cell_bold), Paragraph("Allowed", table_cell_style), Paragraph("Allowed for assigned tasks", table_cell_style)],
        [Paragraph("Self-Registration Restriction", table_cell_bold), Paragraph("System created only", table_cell_style), Paragraph("Default self-registration role", table_cell_style)],
    ]

    rbac_table = Table(rbac_data, colWidths=[150, 177, 177])
    rbac_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), indigo_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(rbac_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph("8. How to Run, Test, and Verify", h1_style))
    story.append(Paragraph(
        "TaskFlow can be booted in two simple terminal commands without complex setup:",
        body_style
    ))

    run_instructions = [
        "<b>Terminal 1 — Spring Boot Backend:</b><br/>"
        "<code>cd \"d:\\Project 1\\backend\"</code><br/>"
        "<code>.\\mvnw.cmd spring-boot:run \"-Dspring-boot.run.profiles=h2\"</code><br/>"
        "<i>(Starts Tomcat on port 8080 with in-memory database and auto-seeds all production demo data in 6 seconds).</i>",
        
        "<b>Terminal 2 — React Vite Frontend:</b><br/>"
        "<code>cd \"d:\\Project 1\\frontend\"</code><br/>"
        "<code>npm run dev</code><br/>"
        "<i>(Starts Vite dev server on port 5173 with proxy configured to backend port 8080).</i>",

        "<b>Pre-Seeded Demo Accounts:</b><br/>"
        "• Manager: <code>manager@taskflow.com</code> / <code>Password123!</code><br/>"
        "• Employee: <code>alex@taskflow.com</code> / <code>Password123!</code>",

        "<b>Key Endpoints & URLs:</b><br/>"
        "• Web App: <code>http://localhost:5173</code><br/>"
        "• Interactive Swagger API Docs: <code>http://localhost:8080/swagger-ui.html</code><br/>"
        "• H2 Database Console: <code>http://localhost:8080/h2-console</code> (JDBC URL: <code>jdbc:h2:mem:taskflow_db</code>, User: <code>sa</code>, Pass: empty)",
    ]

    for item in run_instructions:
        story.append(Paragraph(f"• {item}", bullet_style))
        story.append(Spacer(1, 3))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {output_path}")

if __name__ == "__main__":
    out_file = r"d:\Project 1\TaskFlow_Project_Overview.pdf"
    create_overview_pdf(out_file)
