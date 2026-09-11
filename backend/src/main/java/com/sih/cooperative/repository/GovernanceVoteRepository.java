package com.sih.cooperative.repository;

import com.sih.cooperative.entity.GovernanceVote;
import com.sih.cooperative.entity.VoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GovernanceVoteRepository extends JpaRepository<GovernanceVote, Long> {

    boolean existsByProposalIdAndVoterId(Long proposalId, Long voterId);

    Optional<GovernanceVote> findByProposalIdAndVoterId(Long proposalId, Long voterId);

    List<GovernanceVote> findByProposalId(Long proposalId);

    long countByProposalId(Long proposalId);

    long countByProposalIdAndVoteChoice(Long proposalId, VoteType voteChoice);

    @Query("SELECT v.voteChoice, COUNT(v) FROM GovernanceVote v WHERE v.proposal.id = :proposalId GROUP BY v.voteChoice")
    List<Object[]> countVotesGroupedByChoice(@Param("proposalId") Long proposalId);
}
