import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const listContributions = vi.fn();
const fetchVoyage = vi.fn();
vi.mock('@/fetch/contributeFetch/fetchContributionsData', () => ({
  fetchContributionsData: (...args: unknown[]) => listContributions(...args),
}));
vi.mock('@/fetch/contributeFetch/fetchSubmitEditVoaygesForm', () => ({
  fetchSubmitEditVoaygesForm: (id: string) => fetchVoyage(id),
}));

const { findVoyageIdConflict } =
  await import('@/utils/contribute/voyageIdConflict');
const { checkVoyageConflict, getConflictErrorMessage } =
  await import('@/utils/functions/voyageValidation');

// A new voyage contribution whose review assigned `voyageId`.
const assigned = (
  id: string,
  voyageId: number,
  status: ContributionStatus,
) => ({
  id,
  status,
  root: { type: 'new', schema: 'Voyage', id: `uuid-${id}` },
  changeSet: { changes: [] },
  reviews: [
    {
      stackOrder: 1,
      changeSet: {
        changes: [
          {
            type: 'update',
            entityRef: { type: 'new', schema: 'Voyage', id: `uuid-${id}` },
            changes: [
              {
                kind: 'direct',
                property: 'Voyage_voyage_id',
                changed: voyageId,
              },
            ],
          },
        ],
      },
    },
  ],
});

describe('findVoyageIdConflict', () => {
  beforeEach(() => {
    listContributions.mockReset();
    fetchVoyage.mockReset();
    fetchVoyage.mockRejectedValue(new Error('404'));
  });

  test('another open contribution with the same Voyage ID is a conflict', async () => {
    listContributions.mockResolvedValue({
      data: [assigned('other', 500, ContributionStatus.Submitted)],
    });
    expect(await findVoyageIdConflict('500', 'mine')).toMatch(
      /already used by another contribution \(submitted\)/,
    );
  });

  test('this contribution and rejected ones do not count', async () => {
    listContributions.mockResolvedValue({
      data: [
        assigned('mine', 500, ContributionStatus.Submitted),
        assigned('old', 500, ContributionStatus.Rejected),
      ],
    });
    expect(await findVoyageIdConflict('500', 'mine')).toBeUndefined();
  });

  test('a stored voyage with that id is a conflict', async () => {
    listContributions.mockResolvedValue({ data: [] });
    fetchVoyage.mockResolvedValue({ status: 200, data: { entityRef: {} } });
    expect(await findVoyageIdConflict('500', 'mine')).toMatch(
      /already exists in the database/,
    );
  });

  test('a check that cannot be made reports nothing', async () => {
    listContributions.mockRejectedValue(new Error('offline'));
    expect(await findVoyageIdConflict('500', 'mine')).toBeUndefined();
  });
});

describe('Edit Existing Voyage conflict check', () => {
  test('an accepted, unpublished edit of the voyage blocks a new one', async () => {
    const acceptedEdit = {
      id: 'a',
      status: ContributionStatus.Accepted,
      root: { type: 'existing', schema: 'Voyage', id: 191766 },
    };
    const acceptedQuery = `status=${ContributionStatus.Accepted}&`;
    listContributions.mockImplementation(
      async (_page: number, _limit: number, query: string) => ({
        data: query.startsWith(acceptedQuery) ? [acceptedEdit] : [],
      }),
    );
    const conflict = await checkVoyageConflict(191766, 'existing');
    expect(conflict).toMatchObject({
      hasConflict: true,
      status: ContributionStatus.Accepted,
    });
    expect(getConflictErrorMessage(ContributionStatus.Accepted).status).toBe(
      'accepted',
    );
  });
});
