import {
  Contribution,
  ContributionStatus,
} from '@slavevoyages/voyages-contribute';

import { assignedVoyageId } from '@/components/PresentationComponents/Contribute/utils/assignedVoyageId';
import { fetchContributionsData } from '@/fetch/contributeFetch/fetchContributionsData';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';

const STATUS_LABEL: Record<number, string> = {
  [ContributionStatus.WorkInProgress]: 'work in progress',
  [ContributionStatus.Submitted]: 'submitted',
  [ContributionStatus.Accepted]: 'accepted',
  [ContributionStatus.Published]: 'published',
};

/**
 * Why a new voyage cannot take `voyageId`: another contribution (not rejected)
 * already goes by it, or a stored voyage has it. Undefined when it is free, or
 * when the check cannot be made.
 */
export const findVoyageIdConflict = async (
  voyageId: string,
  contributionId: string,
): Promise<string | undefined> => {
  try {
    const response = await fetchContributionsData(
      1,
      50,
      `search=${encodeURIComponent(voyageId)}`,
    );
    const other = ((response?.data ?? []) as Contribution[]).find(
      (c) =>
        c.id !== contributionId &&
        c.status !== ContributionStatus.Rejected &&
        String(assignedVoyageId(c)) === voyageId,
    );
    if (other) {
      return `Voyage ID ${voyageId} is already used by another contribution (${STATUS_LABEL[other.status] ?? 'open'}).`;
    }
  } catch {
    // Unknown: the stored voyages are still checked below.
  }
  try {
    const stored = await fetchSubmitEditVoaygesForm(voyageId);
    if (stored.status === 200 && stored.data) {
      return `Voyage ID ${voyageId} already exists in the database.`;
    }
  } catch {
    // Not found, or the check failed: nothing to report.
  }
  return undefined;
};
