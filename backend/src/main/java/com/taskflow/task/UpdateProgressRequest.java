package com.taskflow.task;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProgressRequest {
    @NotNull @Min(0) @Max(100)
    private Integer progress;
}
