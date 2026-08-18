/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ContributionStatus,
  getSchema,
  materializeNew,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
  Contribution,
} from '@slavevoyages/voyages-contribute';
import type {
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useColumnDefs } from '@/components/PresentationComponents/Contribute/commons/useColumnDefs';
import { ReviewMode } from '@/components/PresentationComponents/Contribute/ContributionForm';
import {
  transformContributionData,
  TransformedContribution,
} from '@/components/PresentationComponents/Contribute/utils/transformContributionData';
import {
  bulkUpdateContributionStatus,
  BulkStatusResult,
} from '@/fetch/contributeFetch/bulkUpdateContributionStatus';
import {
  fetchContributionByIdForEditor,
  fetchContributionsData,
} from '@/fetch/contributeFetch/fetchContributionsData';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';
import { submitReview } from '@/fetch/contributeFetch/submitReview';
import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';
import { useBatchManagement } from '@/hooks/useBatchManagement';
import { useSearchEditRequestsFilters } from '@/hooks/useSearchEditRequestsFilters';
import { RootState } from '@/redux/store';
import { explainNotSelectable } from '@/utils/contribute/batchPublishability';
import {
  chunkIds,
  emptyResult,
  mergeResults,
  summarise,
} from '@/utils/contribute/bulkDecision';

const BLOCK_SIZE = 50;
const SEARCH_DEBOUNCE_DELAY = 500;

// Submitted rows first, then newest by timestamp within each group
const sortBlock = (
  rows: TransformedContribution[],
): TransformedContribution[] =>
  rows.slice().sort((a, b) => {
    const aRank = a.status === ContributionStatus.Submitted ? 0 : 1;
    const bRank = b.status === ContributionStatus.Submitted ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf();
  });

export const useEditorialPlatformTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { batches } = useBatchManagement({ autoFetch: true });

  // Just-submitted contribution shown as a pinned top row (separate from datasource)
  const submittedId = ((location.state as any)?.submittedId ?? null) as
    | string
    | null;
  const submittedIdRef = useRef<string | null>(submittedId);
  const [pinnedTopRows, setPinnedTopRows] = useState<TransformedContribution[]>(
    [],
  );
  useEffect(() => {
    if (!submittedId) return;
    fetchContributionByIdForEditor(submittedId)
      .then((data) => setPinnedTopRows([transformContributionData(data)]))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Contribution detail state ──────────────────────────────────────────────
  const [active, setActive] = useState<Contribution | undefined>(undefined);
  const [contributionId, setContributionId] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<
    ContributionStatus | undefined
  >(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mode, setMode] = useState(ReviewMode.ReadOnly);
  const [savedContributionState, setSavedContributionState] = useState<
    Contribution | undefined
  >(undefined);
  const [fetchedEntity, setFetchedEntity] = useState<
    MaterializedEntity | undefined
  >(undefined);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [batchManagementVisible, setBatchManagementVisible] = useState(false);
  const [batchAssignmentVisible, setBatchAssignmentVisible] = useState(false);
  const [bulkDeciding, setBulkDeciding] = useState(false);
  // Held after a bulk decision only when something was refused. A run where
  // everything landed says so in a line and needs no report.
  const [bulkResult, setBulkResult] = useState<BulkStatusResult | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // ── Form + grid refs ───────────────────────────────────────────────────────
  const [form] = Form.useForm();
  const gridRef = useRef<any>(null);

  const {
    filters,
    buildFilterQuery,
    handleFilterChange,
    handleClearFilters,
    handleApplyFilters,
    hasActiveFilters,
    activeFilterCount,
    // Arriving from the publish screen, which links through to the exact
    // contributions holding a batch back. Read from the route rather than the
    // URL to keep the address bar free of transient filter state.
  } = useSearchEditRequestsFilters(
    form,
    gridRef,
    (location.state as any)?.filters,
  );

  // ── Infinite row model datasource ─────────────────────────────────────────
  // Use refs so the datasource closure (created once) always reads fresh values
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const buildFilterQueryRef = useRef(buildFilterQuery);
  buildFilterQueryRef.current = buildFilterQuery;

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const page = Math.floor(params.startRow / BLOCK_SIZE) + 1;
        const filterQuery = buildFilterQueryRef.current(filtersRef.current);
        try {
          const response = await fetchContributionsData(
            page,
            BLOCK_SIZE,
            filterQuery,
          );
          let rows = sortBlock(
            (response.data ?? []).map(transformContributionData),
          );
          const total = response.total ?? -1;

          // On first page, pin the just-submitted row to position 0
          if (page === 1 && submittedIdRef.current) {
            const pinnedId = submittedIdRef.current;
            submittedIdRef.current = null; // only pin once
            const alreadyIn = rows.find((r) => r.id === pinnedId);
            if (alreadyIn) {
              rows = [alreadyIn, ...rows.filter((r) => r.id !== pinnedId)];
            } else {
              try {
                const data = await fetchContributionByIdForEditor(pinnedId);
                rows = [transformContributionData(data), ...rows];
              } catch {
                // if fetch fails, just show normal order
              }
            }
          }

          setTotalCount(total > 0 ? total : rows.length);
          params.successCallback(rows, total);
        } catch {
          params.failCallback();
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      event.api.setGridOption('datasource', datasource);
    },
    [datasource],
  );

  // Purge cache when filters change (skip initial mount — onGridReady handles first load)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    gridRef.current?.api?.purgeInfiniteCache();
  }, [filters]);

  // ── URL sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id && id !== contributionId) {
      setContributionId(id);
    } else if (!id && contributionId) {
      setContributionId('');
    }
  }, [id, contributionId]);

  // Load contribution by URL id (deep links / page refresh)
  useEffect(() => {
    if (!id) {
      setActive(undefined);
      setReviews([]);
      setCurrentStatus(undefined);
      setContributionId('');
      setSavedContributionState(undefined);
      setMode(ReviewMode.ReadOnly);
      setFetchedEntity(undefined);
      return;
    }

    if ((active as TransformedContribution)?.id === id) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchContributionByIdForEditor(id);
        const contribution = transformContributionData(data);
        setActive(contribution);
        setCurrentStatus(contribution.status);
        setSavedContributionState(contribution);
        setMode(ReviewMode.ReadOnly);
        setReviews(contribution.reviews || []);
      } catch (err) {
        console.error('Error loading contribution by ID:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.email]);

  // Fetch entity whenever the active contribution changes
  useEffect(() => {
    if (!active) {
      setFetchedEntity(undefined);
      return;
    }

    const fetchEntity = async () => {
      const changes = active.changeSet?.changes;
      if (!changes?.length) return;

      const entityRef = changes[0].entityRef;
      const isExistingVoyage = active.root.type === 'existing';

      if (isExistingVoyage) {
        try {
          const res = await fetchSubmitEditVoaygesForm(String(entityRef.id));
          setFetchedEntity(
            res.status === 200 && res.data
              ? res.data
              : materializeNew(getSchema(entityRef.schema), entityRef.id),
          );
        } catch {
          setFetchedEntity(
            materializeNew(getSchema(entityRef.schema), entityRef.id),
          );
        }
      } else {
        setFetchedEntity(
          materializeNew(getSchema(entityRef.schema), entityRef.id),
        );
      }
    };

    fetchEntity();
  }, [(active as TransformedContribution)?.id]);

  // ── Grid column definitions ────────────────────────────────────────────────
  const columnDefs = useColumnDefs();

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      cellStyle: { paddingTop: '12px', fontSize: '13px' },
    }),
    [],
  );

  const selectionColumnDef = useMemo(
    () => ({
      headerName: 'Assign to\nbatch',
      width: 100,
      resizable: true,
      suppressHeaderMenuButton: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      // Published and rejected rows are not selectable. Without this the
      // checkbox just refuses to tick, which reads as a broken control rather
      // than a deliberate one. The grid has `enableBrowserTooltips`, so this
      // surfaces as the native title.
      tooltipValueGetter: (params: any) =>
        explainNotSelectable(params.data?.status) ?? undefined,
    }),
    [],
  );

  const getRowStyle = useCallback(
    (params: any) => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
      ...(params?.node?.rowPinned === 'top'
        ? { background: '#f6ffed', borderBottom: '2px solid #b7eb8f' }
        : {}),
    }),
    [],
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const empty = useMemo(() => {
    if (!active) return undefined;
    if (fetchedEntity) return fetchedEntity;
    if (active.changeSet?.changes.length > 0) {
      const schema = active.changeSet.changes[0].entityRef.schema;
      const entityId = active.changeSet.changes[0].entityRef.id;
      return materializeNew(getSchema(schema), entityId);
    }
    return undefined;
  }, [active, fetchedEntity]);

  const shouldShowDetail = Boolean(
    id &&
    active &&
    (active as TransformedContribution).id === id &&
    active.changeSet,
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      handleFilterChange('search', value);
      setTimeout(() => {
        if (filters.search === value) handleApplyFilters();
      }, SEARCH_DEBOUNCE_DELAY);
    },
    [filters.search, handleApplyFilters, handleFilterChange],
  );

  const onSelectionChanged = useCallback(() => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    const selectedIds = selectedNodes?.map((node: any) => node.data.id) || [];
    setSelectedRows(selectedIds);
  }, []);

  /**
   * Tear down the open contribution and return to the list.
   *
   * Shared by the Back button and by deciding a contribution: both leave the
   * detail view, and leaving it half-torn-down means the next contribution
   * opens carrying the previous one's reviews or review mode.
   */
  const closeDetail = useCallback(() => {
    setActive(undefined);
    setReviews([]);
    setCurrentStatus(undefined);
    setContributionId('');
    setSavedContributionState(undefined);
    setMode(ReviewMode.ReadOnly);
    setFetchedEntity(undefined);
    navigate('/contribute/editor_main/requests', { replace: true });
  }, [navigate]);

  const handleStatusChange = useCallback(
    async (
      contribId: string,
      newStatus: ContributionStatus,
      decisionComments?: string,
    ) => {
      try {
        await updateContributionStatus(contribId, newStatus, decisionComments);
        gridRef.current?.api?.purgeInfiniteCache();
        // The detail view holds the status it was opened with, so staying here
        // leaves a decided contribution showing its old status with the Submit
        // button still live -- which reads as though nothing happened, and
        // invites deciding it again. Say what landed, then return to the list,
        // which the purge above has already refreshed.
        message.success(
          newStatus === ContributionStatus.Accepted
            ? 'Contribution accepted.'
            : newStatus === ContributionStatus.Rejected
              ? 'Contribution rejected.'
              : newStatus === ContributionStatus.Submitted
                ? 'Reopened for editing — it is back in the submitted queue.'
                : 'Contribution status updated.',
        );
        closeDetail();
      } catch (error) {
        message.error('Failed to update contribution status');
        console.error('Status update error:', error);
      }
    },
    [closeDetail],
  );

  const handleReviewSubmit = useCallback(
    async (review: Review) => {
      if (!id) {
        message.error('Contribution ID is missing');
        return;
      }
      try {
        const hideLoading = message.loading('Submitting review...', 0);
        await submitReview(id, review);
        hideLoading();

        const updatedReviews = [...reviews, review];
        setReviews(updatedReviews);

        if (active?.changeSet) {
          const updated: Contribution = {
            ...active,
            reviews: updatedReviews,
            changeSet: active.changeSet,
          };
          setSavedContributionState(updated);
          setActive(updated);
        }

        setMode(ReviewMode.ReadOnly);
        message.success('Review submitted successfully');
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Failed to submit review';
        message.error(msg);
      }
    },
    [reviews, active, id],
  );

  const handleReviewCancel = useCallback(() => {
    if (savedContributionState) setActive(savedContributionState);
    setMode(ReviewMode.ReadOnly);
    message.info('Review cancelled - changes discarded');
  }, [savedContributionState]);

  const handleStartReview = useCallback(() => {
    if (active) setSavedContributionState(active);
    setMode(ReviewMode.Review);
  }, [active]);

  const handleRowClick = useCallback(
    ({ data, event }: any) => {
      if (!event || !data) return;

      const target = event.target as HTMLElement;
      const isCheckboxClick =
        target.closest('.ag-selection-checkbox') ||
        target.closest('.ag-checkbox-input');
      const colId = target.closest('.ag-cell')?.getAttribute('col-id');
      if (
        isCheckboxClick ||
        (colId && ['status', 'ag-Grid-SelectionColumn'].includes(colId))
      )
        return;

      setActive(data);
      setCurrentStatus(data.status);
      setContributionId(data.id);
      setSavedContributionState(data);
      setMode(ReviewMode.ReadOnly);
      navigate(`/contribute/editor_main/requests/${data.id}`);
    },
    [navigate],
  );

  const handleBackClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      closeDetail();
    },
    [closeDetail],
  );

  const handleOnEditorialDecision = useCallback(
    (decision: 'accept' | 'reject', decisionComments?: string) => {
      const newStatus =
        decision === 'accept'
          ? ContributionStatus.Accepted
          : ContributionStatus.Rejected;
      handleStatusChange(contributionId, newStatus, decisionComments);
    },
    [contributionId, handleStatusChange],
  );

  /**
   * Put an accepted contribution back in the submitted queue.
   *
   * No comment goes with it. A decision comment records the reasoning for a
   * decision, and reopening undoes one rather than making another — the server
   * clears the comment along with the status either way.
   */
  const handleReopenContribution = useCallback(() => {
    if (!contributionId) {
      message.error('Contribution ID is missing');
      return;
    }
    handleStatusChange(contributionId, ContributionStatus.Submitted);
  }, [contributionId, handleStatusChange]);

  const handleGridRefresh = useCallback(() => {
    gridRef.current?.api?.purgeInfiniteCache();
  }, []);

  /**
   * Decide every selected contribution.
   *
   * Sent in chunks because the server caps how many one request may carry, and
   * the chunks are sent one after another rather than together: they are
   * writes, and the server decides each contribution against the row as it
   * stands, so overlapping requests would be racing each other over the same
   * rows the editor just ticked.
   *
   * The grid is refreshed and the selection cleared whatever the outcome. Some
   * of the rows have moved, so the selection no longer describes what is on
   * screen, and leaving the boxes ticked invites deciding them a second time.
   */
  const handleBulkDecision = useCallback(
    async (newStatus: ContributionStatus, verb: string) => {
      if (selectedRows.length === 0) {
        return;
      }
      setBulkDeciding(true);
      const hideLoading = message.loading(
        `Deciding ${selectedRows.length} contributions...`,
        0,
      );
      try {
        let total = emptyResult();
        for (const chunk of chunkIds(selectedRows)) {
          const result = await bulkUpdateContributionStatus(chunk, newStatus);
          total = mergeResults(total, result);
        }
        hideLoading();
        if (total.refused.length > 0) {
          // Kept on screen rather than announced and dismissed: a refusal names
          // contributions the editor has to go back to, which a message that
          // fades cannot carry.
          setBulkResult(total);
          message.warning(summarise(total, verb));
        } else {
          message.success(summarise(total, verb));
        }
      } catch (error) {
        hideLoading();
        // The request failed as a whole, so nothing in this chunk was decided
        // -- but earlier chunks may have been, which is why the grid is still
        // refreshed below.
        message.error(
          error instanceof Error
            ? error.message
            : 'Failed to decide the selected contributions',
        );
        console.error('Bulk decision error:', error);
      } finally {
        setBulkDeciding(false);
        gridRef.current?.api?.purgeInfiniteCache();
        gridRef.current?.api?.deselectAll();
        setSelectedRows([]);
      }
    },
    [selectedRows],
  );

  const handleClearSelection = useCallback(() => {
    gridRef.current?.api.deselectAll();
    setSelectedRows([]);
  }, []);

  return {
    // Grid
    gridRef,
    datasource,
    onGridReady,
    columnDefs,
    defaultColDef,
    selectionColumnDef,
    getRowStyle,
    totalCount,
    isLoading,
    pinnedTopRows,

    // Contribution detail
    active,
    setActive,
    contributionId,
    currentStatus,
    reviews,
    mode,
    fetchedEntity,
    empty,
    shouldShowDetail,
    accessLevel: PropertyAccessLevel.Editor,

    // UI state
    showFilters,
    setShowFilters,
    selectedRows,
    setSelectedRows,
    batchManagementVisible,
    setBatchManagementVisible,
    batchAssignmentVisible,
    setBatchAssignmentVisible,

    // Filters
    filters,
    form,
    hasActiveFilters,
    activeFilterCount,
    handleFilterChange,
    handleClearFilters,
    handleApplyFilters,

    // Batches
    batches,

    // Handlers
    handleSearchChange,
    onSelectionChanged,
    handleStatusChange,
    handleReviewSubmit,
    handleReviewCancel,
    handleStartReview,
    handleRowClick,
    handleBackClick,
    handleOnEditorialDecision,
    handleReopenContribution,
    handleGridRefresh,
    handleClearSelection,
    handleBulkDecision,
    bulkDeciding,
    bulkResult,
    setBulkResult,
  };
};
