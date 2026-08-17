import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { describe, expect, it } from 'vitest';

import type { BatchWithContributions } from '@/fetch/contributeFetch/batchApi';
import {
  getBatchPublishability,
  summariseBlockers,
} from '@/utils/contribute/batchPublishability';

/**
 * Only `status` is read, so the contributions are stubbed to that. Casting once
 * here keeps the cast out of every case.
 */
const batchOf = (...statuses: ContributionStatus[]): BatchWithContributions =>
  ({
    id: 1,
    title: 'Batch',
    comments: '',
    published: null,
    contributions: statuses.map((status, i) => ({
      id: `c${i}`,
      status,
    })),
  }) as BatchWithContributions;

const { WorkInProgress, Submitted, Accepted, Rejected, Published } =
  ContributionStatus;

describe('getBatchPublishability', () => {
  it('publishes a batch whose contributions are all accepted', () => {
    const result = getBatchPublishability(batchOf(Accepted, Accepted));
    expect(result.publishable).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.total).toBe(2);
    expect(result.counts.accepted).toBe(2);
  });

  it('publishes when rejected contributions sit alongside accepted ones', () => {
    // The server only refuses on *undecided* contributions; a rejection is a
    // decision, and publication simply skips it.
    const result = getBatchPublishability(batchOf(Accepted, Rejected));
    expect(result.publishable).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('refuses while any contribution is still awaiting a decision', () => {
    const result = getBatchPublishability(batchOf(Accepted, Submitted));
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe(
      '1 contribution still awaiting an editorial decision.',
    );
  });

  it('counts multiple undecided contributions in the reason', () => {
    const result = getBatchPublishability(batchOf(Submitted, Submitted));
    expect(result.reason).toBe(
      '2 contributions still awaiting an editorial decision.',
    );
  });

  it('refuses a batch holding nothing accepted', () => {
    // Batch 15 as it stood: one contribution, still being edited.
    const result = getBatchPublishability(batchOf(WorkInProgress));
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe('Nothing in this batch is accepted yet.');
  });

  it('refuses an empty batch, and says so differently', () => {
    const result = getBatchPublishability(batchOf());
    expect(result.publishable).toBe(false);
    expect(result.total).toBe(0);
    expect(result.reason).toBe(
      'This batch is empty. Assign accepted contributions to it first.',
    );
  });

  it('names the already-published case rather than saying nothing is accepted', () => {
    // Batch 13 after its publish: the contribution moved to Published, so a
    // bare "nothing is accepted" would read as though work had gone missing.
    const result = getBatchPublishability(batchOf(Published));
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe(
      'Everything in this batch has already been published.',
    );
  });

  it('reports a mixed batch as not accepted rather than already published', () => {
    // Batch 14: work in progress plus one already out. Not the same case.
    const result = getBatchPublishability(
      batchOf(
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        WorkInProgress,
        Published,
      ),
    );
    expect(result.total).toBe(7);
    expect(result.publishable).toBe(false);
    expect(result.reason).toBe('Nothing in this batch is accepted yet.');
  });

  it('treats a batch with no contributions field as empty', () => {
    // Create/update responses carry no contributions; that must not crash.
    const result = getBatchPublishability({
      id: 1,
      title: 'Batch',
      comments: '',
      published: null,
    } as BatchWithContributions);
    expect(result.total).toBe(0);
    expect(result.publishable).toBe(false);
  });
});

describe('summariseBlockers', () => {
  it('says nothing when the batch is ready', () => {
    expect(
      summariseBlockers(getBatchPublishability(batchOf(Accepted))),
    ).toBeNull();
  });

  it('names undecided contributions', () => {
    expect(
      summariseBlockers(getBatchPublishability(batchOf(Submitted, Accepted))),
    ).toBe('1 awaiting decision');
  });

  it('joins several blockers', () => {
    expect(
      summariseBlockers(
        getBatchPublishability(batchOf(Submitted, WorkInProgress)),
      ),
    ).toBe('1 awaiting decision · 1 still being edited');
  });

  it('calls an empty batch empty', () => {
    expect(summariseBlockers(getBatchPublishability(batchOf()))).toBe('Empty');
  });
});
