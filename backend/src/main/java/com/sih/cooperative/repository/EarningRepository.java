package com.sih.cooperative.repository;

import com.sih.cooperative.entity.Earning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface EarningRepository extends JpaRepository<Earning, Long>, JpaSpecificationExecutor<Earning> {

    Optional<Earning> findByJobId(Long jobId);

    boolean existsByJobId(Long jobId);

    List<Earning> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    Optional<Earning> findByWorkerIdAndJobId(Long workerId, Long jobId);

    Optional<Earning> findByIdAndWorkerId(Long id, Long workerId);

    List<Earning> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<Earning> findByCustomerIdAndJobId(Long customerId, Long jobId);

    List<Earning> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(e.grossAmount), 0) FROM Earning e WHERE e.worker.id = :workerId")
    BigDecimal sumGrossAmountByWorkerId(@Param("workerId") Long workerId);

    @Query("SELECT COALESCE(SUM(e.platformFee), 0) FROM Earning e WHERE e.worker.id = :workerId")
    BigDecimal sumPlatformFeeByWorkerId(@Param("workerId") Long workerId);

    @Query("SELECT COALESCE(SUM(e.workerEarning), 0) FROM Earning e WHERE e.worker.id = :workerId")
    BigDecimal sumWorkerEarningByWorkerId(@Param("workerId") Long workerId);

    @Query("SELECT COALESCE(SUM(e.workerEarning), 0) FROM Earning e WHERE e.worker.id = :workerId AND e.status = 'AVAILABLE'")
    BigDecimal sumAvailableWorkerEarningByWorkerId(@Param("workerId") Long workerId);

    long countByWorkerId(Long workerId);

    @Query("SELECT COALESCE(SUM(e.grossAmount), 0) FROM Earning e")
    BigDecimal sumAllGrossAmount();

    @Query("SELECT COALESCE(SUM(e.platformFee), 0) FROM Earning e")
    BigDecimal sumAllPlatformFee();

    @Query("SELECT COALESCE(SUM(e.workerEarning), 0) FROM Earning e")
    BigDecimal sumAllWorkerEarning();

    @Query("SELECT COALESCE(SUM(e.workerEarning), 0) FROM Earning e WHERE e.status = 'AVAILABLE'")
    BigDecimal sumAllAvailableWorkerEarning();
}
