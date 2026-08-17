/**
 * Whether a batch can be published, decided from the contributions the batch
 * list already carries.
 *
 * The server refuses a batch for two distinct reasons, and both are knowable
 * before asking it:
 *
 * - any contribution still Submitted — "Batch has contributions without an
 *   editorial decision"
 * - nothing Accepted — "No accepted contributions found in batch"
 *
 * Deciding it here turns a round trip and a refusal into a disabled button with
 * the reason attached. The rules are duplicated from the server on purpose: this
 * is a courtesy check, and the server stays the authority. If the two ever
 * disagree the publish is still refused correctly — the button is just wrong
 * about it.
 */

import { ContributionStatus } from '@slavevoyages/voyages-contribute';

import type { BatchWithContributions } from '@/fetch/contributeFetch/batchApi';

export interface BatchStatusCounts {
  workInProgress: number;
  submitted: number;
  accepted: number;
  rejected: number;
  published: number;
}

export interface BatchPublishability {
  /** How many contributions the batch holds, whatever their status. */
  total: number;
  counts: BatchStatusCounts;
  publishable: boolean;
  /**
   * Why not, in words for the editor. Null when the batch is publishable, so
   * the caller can key a tooltip off its presence.
   */
  reason: string | null;
}

const emptyCounts = (): BatchStatusCounts => ({
  workInProgress: 0,
  submitted: 0,
  accepted: 0,
  rejected: 0,
  published: 0,
});

const COUNT_KEY: Partial<Record<ContributionStatus, keyof BatchStatusCounts>> =
  {
    [ContributionStatus.WorkInProgress]: 'workInProgress',
    [ContributionStatus.Submitted]: 'submitted',
    [ContributionStatus.Accepted]: 'accepted',
    [ContributionStatus.Rejected]: 'rejected',
    [ContributionStatus.Published]: 'published',
  };

const countByStatus = (
  contributions: BatchWithContributions['contributions'],
): BatchStatusCounts => {
  const counts = emptyCounts();
  for (const contribution of contributions ?? []) {
    const key = COUNT_KEY[contribution.status];
    // An unrecognised status is left out rather than folded into another
    // bucket, which would shift the counts away from what the editor can see.
    if (key) {
      counts[key] += 1;
    }
  }
  return counts;
};

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/**
 * Phrased as what the editor has to *do*, not as what the batch lacks — the
 * message appears next to a disabled button, where "why can't I click this"
 * is the only question being asked.
 */
const explain = (counts: BatchStatusCounts, total: number): string | null => {
  if (total === 0) {
    return 'This batch is empty. Assign accepted contributions to it first.';
  }
  if (counts.submitted > 0) {
    return `${plural(counts.submitted, 'contribution')} still awaiting an editorial decision.`;
  }
  if (counts.accepted === 0) {
    if (counts.published === total) {
      return 'Everything in this batch has already been published.';
    }
    return 'Nothing in this batch is accepted yet.';
  }
  return null;
};

export const getBatchPublishability = (
  batch: BatchWithContributions,
): BatchPublishability => {
  const counts = countByStatus(batch.contributions);
  const total = batch.contributions?.length ?? 0;
  const reason = explain(counts, total);
  return {
    total,
    counts,
    // Mirrors the server: every contribution decided, and at least one accepted.
    publishable: counts.submitted === 0 && counts.accepted > 0,
    reason,
  };
};

/**
 * A short line for under the batch title, naming only what stands in the way.
 * Null when there is nothing to say.
 */
export const summariseBlockers = (
  publishability: BatchPublishability,
): string | null => {
  const { counts, total } = publishability;
  if (total === 0) {
    return 'Empty';
  }
  const parts: string[] = [];
  if (counts.submitted > 0) {
    parts.push(`${counts.submitted} awaiting decision`);
  }
  if (counts.workInProgress > 0) {
    parts.push(`${counts.workInProgress} still being edited`);
  }
  if (counts.accepted === 0 && counts.published > 0) {
    parts.push(`${counts.published} already published`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
};
