import { ContributionStatus } from '@slavevoyages/voyages-contribute';

import { fetchCheckVoyageConflict } from '@/fetch/contributeFetch/fetchContributionsData';

export interface VoyageConflictResult {
  hasConflict: boolean;
  status?: number;
  contributionId?: string;
  conflictType?: 'new' | 'existing';
}

/**
 * Check if a voyage ID already exists in user's work-in-progress contributions
 * @param voyageId - The voyage ID to check
 * @param userEmail - The user's email address
 * @param checkType - Type of conflict to check: 'new' (NewVoyages), 'existing' (EditExistingVoyage), or 'both'
 * @returns Promise with conflict information
 */
export const checkVoyageConflict = async (
  voyageId: string | number,
  userEmail: string,
  checkType: 'new' | 'existing',
): Promise<VoyageConflictResult> => {
  try {
    const wipResponse = await fetchCheckVoyageConflict(userEmail);
    const wipContributions = wipResponse?.data || [];

    // Check for conflicts based on type
    for (const contrib of wipContributions) {
      const rootType = contrib.root?.type;
      const rootId = String(contrib.root?.id);
      const voyageIdStr = String(voyageId);

      // Check for 'new' type conflicts (NewVoyages)
      if (checkType === 'new' && rootType === 'new' && rootId === voyageIdStr) {
        return {
          hasConflict: true,
          status: contrib.status,
          contributionId: contrib.id,
          conflictType: 'new',
        };
      }

      // Check for 'existing' type conflicts (EditExistingVoyage)
      if (
        checkType === 'existing' &&
        rootType === 'existing' &&
        rootId === voyageIdStr
      ) {
        return {
          hasConflict: true,
          status: contrib.status,
          contributionId: contrib.id,
          conflictType: 'existing',
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking voyage conflict:', error);
    throw error;
  }
};

export interface ConflictErrorMessage {
  status: string;
  content: string;
}

/**
 * Get a user-friendly error message for voyage conflicts
 * @param conflictStatus - Type of conflict detected
 * @returns User-friendly error message with status
 */
export const getConflictErrorMessage = (
  conflictStatus: number,
): ConflictErrorMessage => {
  if (conflictStatus === ContributionStatus.Submitted) {
    return {
      status: 'submitted',
      content: `This voyage has already been submitted for evaluation. Please contact the editor at editors@slavevoyages.org for any further revisions or additional information you wish to contribute.`,
    };
  }

  if (conflictStatus === ContributionStatus.WorkInProgress) {
    return {
      status: 'work-in-progress',
      content: `This voyage is already being edited in your work-in-progress contributions.\n Please complete or delete the existing contribution before creating a new one.`,
    };
  }

  return {
    status: 'conflict',
    content: 'This voyage already exists in your contributions.',
  };
};
