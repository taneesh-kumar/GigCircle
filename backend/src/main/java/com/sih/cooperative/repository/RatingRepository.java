package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Rating;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    @EntityGraph(attributePaths = {"job", "customer", "worker"})
    Optional<Rating> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);

    @EntityGraph(attributePaths = {"job", "customer", "worker"})
    List<Rating> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.worker.id = :workerId")
    Double findAverageScoreByWorkerId(@Param("workerId") Long workerId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.worker.id = :workerId")
    Long countByWorkerId(@Param("workerId") Long workerId);
}
