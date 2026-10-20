package com.taskflow.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateProjectRequest {
    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    private Project.Status status = Project.Status.PLANNING;
    private LocalDate startDate;
    private LocalDate endDate;
}
