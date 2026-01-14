/**
 * Utility functions for voter queries
 * Excludes test voters from all statistics
 */

/**
 * Test voters are identified by voterId starting with 'TEST_'
 * They should be excluded from all counts and statistics
 */
export const TEST_VOTER_PREFIX = 'TEST_'

/**
 * Adds a filter to exclude test voters from queries
 * Use this in all voter count queries
 */
export function excludeTestVoters(whereClause: any = {}) {
  return {
    ...whereClause,
    voterId: {
      not: {
        startsWith: TEST_VOTER_PREFIX
      }
    }
  }
}

/**
 * Check if a voter is a test voter
 */
export function isTestVoter(voterId: string | null | undefined): boolean {
  if (!voterId) return false
  return voterId.startsWith(TEST_VOTER_PREFIX)
}

