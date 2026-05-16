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
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

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
import { useColumnDefs } from '@/components/PresentationComponents/Contribute/commons/useColumnDefs';
import { ReviewMode } from '@/components/PresentationComponents/Contribute/ContributionForm';
import {
  transformContributionData,
  TransformedContribution,
} from '@/components/PresentationComponents/Contribute/utils/transformContributionData';

const BLOCK_SIZE = 50;
const SEARCH_DEBOUNCE_DELAY = 500;

export const useEditorialPlatformTable = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { batches } = useBatchManagement({ autoFetch: true });

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
  } = useSearchEditRequestsFilters(form, gridRef);

  // ── Infinite row model datasource ─────────────────────────────────────────
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
          const rows = (response.data ?? []).map(transformContributionData);
          const total = response.total ?? -1;
          setTotalCount(total > 0 ? total : rows.length);
          params.successCallback(rows, total);
        } catch {
          params.failCallback();
        }
      },
    }),
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
    }),
    [],
  );

  const getRowStyle = useCallback(
    () => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
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

  const handleStatusChange = useCallback(
    async (
      contribId: string,
      newStatus: ContributionStatus,
      decisionComments?: string,
    ) => {
      try {
        await updateContributionStatus(contribId, newStatus, decisionComments);
        gridRef.current?.api?.purgeInfiniteCache();
      } catch (error) {
        message.error('Failed to update contribution status');
        console.error('Status update error:', error);
      }
    },
    [],
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
      setActive(undefined);
      setReviews([]);
      setCurrentStatus(undefined);
      setContributionId('');
      setSavedContributionState(undefined);
      setMode(ReviewMode.ReadOnly);
      setFetchedEntity(undefined);
      navigate('/contribute/editor_main/requests', { replace: true });
    },
    [navigate],
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

  const handleGridRefresh = useCallback(() => {
    gridRef.current?.api?.purgeInfiniteCache();
  }, []);

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
    handleGridRefresh,
    handleClearSelection,
  };
};
