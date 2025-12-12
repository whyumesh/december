/**
 * Voter Eligibility and Voting Completion Utilities
 * 
 * Functions to check if a voter has completed all eligible votes
 */

import { prisma } from './db';

/**
 * Check if voter has completed all eligible votes
 * 
 * @param voterId - Voter ID to check
 * @returns Object with completion status and details
 */
export async function hasCompletedAllEligibleVotes(voterId: string): Promise<{
  completed: boolean;
  eligibleElections: string[];
  completedElections: string[];
  remainingElections: string[];
  message?: string;
}> {
  // Get voter with zones, votes, and user info
  const voter = await prisma.voter.findUnique({
    where: { id: voterId },
    include: {
      yuvaPankZone: true,
      karobariZone: true,
      trusteeZone: true,
      votes: true,
      user: true,
    },
  });

  if (!voter) {
    return {
      completed: false,
      eligibleElections: [],
      completedElections: [],
      remainingElections: [],
      message: 'Voter not found',
    };
  }

  // Check which elections voter has voted in
  const hasVoted = {
    yuvaPank: voter.votes.some(vote => vote.yuvaPankhCandidateId !== null),
    karobariMembers: voter.votes.some(vote => vote.karobariCandidateId !== null),
    trustees: voter.votes.some(vote => vote.trusteeCandidateId !== null),
  };

  // Determine eligible elections
  const eligibleElections: string[] = [];
  const completedElections: string[] = [];
  const remainingElections: string[] = [];

  // 1. Yuva Pankh Election
  if (voter.yuvaPankZone) {
    eligibleElections.push('Yuva Pankh');
    if (hasVoted.yuvaPank) {
      completedElections.push('Yuva Pankh');
    } else {
      remainingElections.push('Yuva Pankh');
    }
  }

  // 2. Karobari Members Election
  // Note: All Karobari elections are completed, so having a zone means it's done
  if (voter.karobariZone) {
    eligibleElections.push('Karobari Samiti');
    // Since all Karobari elections are completed, having a zone means it's done
    completedElections.push('Karobari Samiti');
  }

  // 3. Trustee Election (age requirement: 18+)
  const voterAge = voter.age || (voter.user?.age ?? null);
  if (voter.trusteeZone && voterAge !== null && voterAge >= 18) {
    eligibleElections.push('Trust Mandal');
    if (hasVoted.trustees) {
      completedElections.push('Trust Mandal');
    } else {
      remainingElections.push('Trust Mandal');
    }
  }

  // Check if all eligible elections are completed
  const completed = eligibleElections.length > 0 && remainingElections.length === 0;

  let message: string | undefined;
  if (completed) {
    message = `You have successfully completed voting in all eligible elections (${completedElections.join(', ')}). Login is no longer available.`;
  }

  return {
    completed,
    eligibleElections,
    completedElections,
    remainingElections,
    message,
  };
}

/**
 * Check if voter has completed all eligible votes (by voter ID string)
 * 
 * @param voterIdString - Voter ID string (voterId field)
 * @returns Object with completion status and details
 */
export async function hasCompletedAllEligibleVotesByVoterId(voterIdString: string): Promise<{
  completed: boolean;
  eligibleElections: string[];
  completedElections: string[];
  remainingElections: string[];
  message?: string;
}> {
  // Find voter by voterId
  const voter = await prisma.voter.findUnique({
    where: { voterId: voterIdString },
    select: { id: true },
  });

  if (!voter) {
    return {
      completed: false,
      eligibleElections: [],
      completedElections: [],
      remainingElections: [],
      message: 'Voter not found',
    };
  }

  return hasCompletedAllEligibleVotes(voter.id);
}

