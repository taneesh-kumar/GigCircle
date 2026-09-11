export type ProposalStatus = 'DRAFT' | 'OPEN' | 'PASSED' | 'REJECTED' | 'CLOSED';

export type ProposalCategory = 'POLICY' | 'PLATFORM_FEE' | 'DISPUTE_RULE' | 'BENEFITS' | 'GENERAL';

export type VoteType = 'YES' | 'NO' | 'ABSTAIN';

export interface ProposalResponse {
  id: number;
  title: string;
  description: string;
  category: ProposalCategory;
  status: ProposalStatus;
  createdById: number;
  createdByName: string;
  createdByRole: string;
  votingStartsAt?: string;
  votingEndsAt?: string;
  createdAt: string;
  updatedAt: string;

  // Derived vote tallies
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;

  // Current viewer's state
  userHasVoted: boolean;
  userVote?: VoteType | null;
  userCanVote: boolean;
}

export interface ProposalResultResponse {
  proposalId: number;
  title: string;
  category: ProposalCategory;
  status: ProposalStatus;
  votingStartsAt?: string;
  votingEndsAt?: string;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  passed: boolean;
}

export interface CreateProposalRequest {
  title: string;
  description: string;
  category?: ProposalCategory;
}

export interface OpenProposalRequest {
  votingDurationDays?: number;
  votingEndsAt?: string;
}

export interface CastVoteRequest {
  voteChoice: VoteType;
}
