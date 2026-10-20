package com.taskflow.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT p FROM Project p WHERE p.archived = false AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<Project> findAllFiltered(
            @Param("search") String search,
            @Param("status") Project.Status status,
            Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.manager.id = :managerId AND p.archived = false")
    List<Project> findByManagerId(@Param("managerId") Long managerId);

    long countByArchivedFalse();

    long countByStatusAndArchivedFalse(Project.Status status);
}
