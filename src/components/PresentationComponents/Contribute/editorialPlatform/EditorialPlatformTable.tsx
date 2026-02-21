// //* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DownOutlined,
  SettingOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  ContributionStatus,
  getSchema,
  materializeNew,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
  Contribution,
} from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import {
  Button,
  Card,
  Space,
  Typography,
  Form,
  Pagination,
  Badge,
  message,
  Dropdown,
  Tag,
} from 'antd';
import '@/style/table.scss';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const { Text } = Typography;
import '@/style/contributeContent.scss';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { fetchContributionsData } from '@/fetch/contributeFetch/fetchContributionsData';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';
import { submitReview } from '@/fetch/contributeFetch/submitReview';
import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';
import { useBatchManagement } from '@/hooks/useBatchManagement';
import { useSearchEditRequestsFilters } from '@/hooks/useSearchEditRequestsFilters';
import { RootState } from '@/redux/store';

import BatchManagement from '../BatchComponent/BatchManagement';
import BatchAssignmentModal from '../BatchComponent/Modal/BatchAssignmentModal';
import { ActiveFiltersTag } from '../commons/ActiveFiltersTag';
import { FilterPanel } from '../commons/FilterPanel';
import { FilterToggleButton } from '../commons/FilterToggleButton';
import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import { SearchInput } from '../commons/SearchInput';
import { statusConfig } from '../commons/StatusCellRenderer';
import { useColumnDefs } from '../commons/useColumnDefs';
import { ContributionForm, ReviewMode } from '../ContributionForm';
import {
  transformContributionData,
  TransformedContribution,
} from '../utils/transformContributionData';

import { Box } from '@mui/material';

const { Title } = Typography;

const SEARCH_DEBOUNCE_DELAY = 500;

interface EditorialPlatformPlatProps {
  openSideBar: boolean;
}

// Main component
const EditorialPlatformTable: React.FC<EditorialPlatformPlatProps> = ({
  openSideBar,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { batches } = useBatchManagement({
    autoFetch: true,
  });
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync contributionId with URL param
  useEffect(() => {
    if (id && id !== contributionId) {
      setContributionId(id);
    } else if (!id && contributionId) {
      setContributionId('');
    }
  }, [id, contributionId]);
  const [contribs, setContribs] = useState<TransformedContribution[]>([]);
  const [page, setPage] = useState(1);
  const [totalResultsCount, setTotalResultsCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [batchManagementVisible, setBatchManagementVisible] = useState(false);
  const [batchAssignmentVisible, setBatchAssignmentVisible] = useState(false);

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

  useEffect(() => {
    const loadContribution = async () => {
      const filterQuery = buildFilterQuery(filters);
      try {
        const response = await fetchContributionsData(filterQuery);
        const contributionsArray = response.data;
        const transformedRows = contributionsArray.map(
          transformContributionData,
        );
        setContribs(transformedRows);
        setTotalResultsCount(response?.total || transformedRows.length);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    loadContribution();
  }, [filters, buildFilterQuery, user, refreshTrigger]);

  // Load contribution when ID in URL changes
  useEffect(() => {
    const loadContributionEntity = async () => {
      if (id && user?.email && contribs.length > 0) {
        const contribution = contribs.find((c) => c.id === id);
        if (contribution) {
          setActive(contribution);
          setCurrentStatus(contribution.status);
          setSavedContributionState(contribution);
          setMode(ReviewMode.ReadOnly);
          setReviews(contribution.reviews || []);

          const isExistingVoyage = contribution.root.type === 'existing';

          // Fetch the actual entity for existing voyages
          if (
            contribution.changeSet?.changes &&
            contribution.changeSet.changes.length > 0
          ) {
            const entityRef = contribution.changeSet.changes[0].entityRef;
            if (isExistingVoyage) {
              try {
                const res = await fetchSubmitEditVoaygesForm(
                  String(entityRef.id),
                );
                if (res.status === 200 && res.data) {
                  setFetchedEntity(res.data);
                } else {
                  // Fallback to blank entity if fetch fails
                  console.error(
                    'Failed to fetch existing voyage, using blank entity',
                  );
                  setFetchedEntity(
                    materializeNew(getSchema(entityRef.schema), entityRef.id),
                  );
                }
              } catch (error) {
                console.error('Error fetching existing voyage:', error);
                // Fallback to blank entity
                setFetchedEntity(
                  materializeNew(getSchema(entityRef.schema), entityRef.id),
                );
              }
            } else {
              // For new voyages, create blank entity
              setFetchedEntity(
                materializeNew(getSchema(entityRef.schema), entityRef.id),
              );
            }
          }
        }
      } else if (!id) {
        // Clear state when no ID in URL
        setActive(undefined);
        setReviews([]);
        setCurrentStatus(undefined);
        setContributionId('');
        setSavedContributionState(undefined);
        setMode(ReviewMode.ReadOnly);
        setFetchedEntity(undefined);
      }
    };

    loadContributionEntity();
  }, [id, contribs, user?.email]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      handleFilterChange('search', value);
      setTimeout(() => {
        if (filters.search === value) {
          handleApplyFilters();
        }
      }, SEARCH_DEBOUNCE_DELAY);
    },
    [filters.search, handleApplyFilters, handleFilterChange],
  );

  // Handle row selection
  const onSelectionChanged = useCallback(() => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes();
    const selectedIds =
      selectedNodes?.map((node: any) => {
        return node.data.id;
      }) || [];
    setSelectedRows(selectedIds);
  }, []);

  // Bulk actions menu
  const bulkActionsMenuItems = [
    {
      key: 'assign-batch',
      icon: <TeamOutlined />,
      label: 'Assign to Batch',
      onClick: () => {
        if (selectedRows.length === 0) {
          message.warning('Please select contributions to assign');
          return;
        }
        setBatchAssignmentVisible(true);
      },
    },
    {
      key: 'approve',
      icon: <CheckCircleOutlined />,
      label: 'Bulk Approve',
      onClick: () => {
        if (selectedRows.length === 0) {
          message.warning('Please select contributions to approve');
          return;
        }
        // Handle bulk approval
        message.info('Bulk approval functionality coming soon');
      },
    },
  ];

  // Then update your Dropdown:
  <Dropdown menu={{ items: bulkActionsMenuItems }} trigger={['click']}>
    <Button type="primary">
      Bulk Actions <DownOutlined />
    </Button>
  </Dropdown>;

  const handleStatusChange = useCallback(
    async (
      contributionId: string,
      newStatus: ContributionStatus,
      decisionComments?: string,
    ) => {
      try {
        await updateContributionStatus(
          contributionId,
          newStatus,
          decisionComments,
        );
        console.log({ contributionId, newStatus, decisionComments });
        // Update local state
        setContribs((prev) =>
          prev.map((contrib) =>
            contrib.id === contributionId
              ? { ...contrib, status: newStatus }
              : contrib,
          ),
        );

        // Refresh grid to show updated data
        if (gridRef.current?.api) {
          gridRef.current.api.refreshCells();
        }
      } catch (error) {
        message.error('Failed to update contribution status');
        console.error('Status update error:', error);
      }
    },
    [],
  );
  const columnDefs = useColumnDefs();

  const handlePageChange = useCallback(
    (newPage: number, pageSize?: number) => {
      setPage(newPage);
      if (pageSize && pageSize !== rowsPerPage) {
        setRowsPerPage(pageSize);
      }
      gridRef.current?.api.paginationGoToPage(newPage - 1);
    },
    [rowsPerPage],
  );

  const empty = useMemo(() => {
    if (!active) return undefined;

    // Use the fetched entity if available
    if (fetchedEntity) {
      return fetchedEntity;
    }

    // Fallback: create a blank entity if fetch is still in progress or failed
    if (active.changeSet && active.changeSet.changes.length > 0) {
      const schema = active.changeSet.changes[0].entityRef.schema;
      const id = active.changeSet.changes[0].entityRef.id;
      return materializeNew(getSchema(schema), id);
    }
    return undefined;
  }, [active, fetchedEntity]);

  const getRowRowStyle = useCallback(
    () => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
    }),
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      cellStyle: {
        paddingTop: '12px',
        fontSize: '13px',
      },
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

  const handleReviewSubmit = useCallback(
    async (review: Review) => {
      if (!id) {
        message.error('Contribution ID is missing');
        return;
      }

      try {
        console.log('Submitting review:', review);

        // Show loading message
        const hideLoading = message.loading('Submitting review...', 0);

        // Submit to backend
        const response = await submitReview(id, review);

        hideLoading();

        console.log('Backend response:', response);

        // Add the new review to existing reviews
        const updatedReviews = [...reviews, review];
        setReviews(updatedReviews);

        if (active?.changeSet) {
          // Update contribution state with the new review
          // NOTE: Do NOT merge review changes into changeSet.changes -
          // they should only be in the reviews array to avoid double-application
          const updatedContributionState: Contribution = {
            ...active,
            // Include the updated reviews so they stack properly
            reviews: updatedReviews,
            // Keep original changeSet unchanged - reviews are tracked separately
            changeSet: active.changeSet,
          };

          // Save this as the new baseline state
          setSavedContributionState(updatedContributionState);
          setActive(updatedContributionState);

          console.log('Updated contribution state:', updatedContributionState);
        }

        // Exit review mode
        setMode(ReviewMode.ReadOnly);

        message.success('Review submitted successfully');
        console.log('Updated reviews:', updatedReviews);
      } catch (error) {
        console.error('Error submitting review:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to submit review';
        message.error(errorMessage);
      }
    },
    [reviews, active, id],
  );

  const handleReviewCancel = useCallback(() => {
    // Revert to the saved state (either original or last submitted)
    if (savedContributionState) {
      setActive(savedContributionState);
    }

    // Exit review mode
    setMode(ReviewMode.ReadOnly);

    message.info('Review cancelled - changes discarded');
  }, [savedContributionState]);

  const handleStartReview = useCallback(() => {
    console.log('Starting review for contribution:', contributionId);

    // Save the current state as the baseline
    if (active) {
      setSavedContributionState(active);
    }
    setMode(ReviewMode.Review);
  }, [active, contributionId]);
  // Handle row click - load contribution
  const handleRowClick = useCallback(
    ({ data, event }: any) => {
      if (!event || !data) return;

      const target = event.target as HTMLElement;
      const isCheckboxClick =
        target.closest('.ag-selection-checkbox') ||
        target.closest('.ag-checkbox-input');
      const cellElement = target.closest('.ag-cell');
      const colId = cellElement?.getAttribute('col-id');
      const disabledColumns = ['status', 'ag-Grid-SelectionColumn'];

      if (isCheckboxClick || (colId && disabledColumns.includes(colId))) {
        return;
      }

      // Load the contribution
      setActive(data);
      setCurrentStatus(data.status);
      setContributionId(data.id);

      // Set the saved state to the current data (this is the baseline)
      setSavedContributionState(data);
      // Reset to read-only mode
      setMode(ReviewMode.ReadOnly);

      navigate(`/contribute/editor_main/requests/${data.id}`);
    },
    [navigate],
  );

  const handleBackClick = useCallback(
    (e?: React.MouseEvent) => {
      // Prevent default link behavior if event exists
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Clear all state before navigation to ensure clean reset
      setActive(undefined);
      setReviews([]);
      setCurrentStatus(undefined);
      setContributionId('');
      setSavedContributionState(undefined);
      setMode(ReviewMode.ReadOnly);
      setFetchedEntity(undefined);

      // Navigate with replace to update URL without adding history entry
      // The useEffect will ensure state stays cleared when URL changes
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

  const shouldShowDetail = Boolean(
    id && active && active.id === id && active.changeSet,
  );
  if (shouldShowDetail) {
    return (
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <Button onClick={handleBackClick} style={{ height: '32px' }}>
            ← Back to Table
          </Button>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {contributionId && currentStatus !== undefined && (
              <span>
                <Text strong>Status: </Text>
                <Tag
                  color={statusConfig[currentStatus]?.color || '#1890ff'}
                  style={{
                    fontWeight: 500,
                  }}
                >
                  {statusConfig[currentStatus]?.label ||
                    ContributionStatus[currentStatus]}
                </Tag>
              </span>
            )}
            <span>
              <Tag
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'flex-end',
                  background: mode === ReviewMode.Edit ? '#fff7e6' : '#f0f9ff',
                  border: `1px solid ${mode === ReviewMode.Edit ? '#ffd591' : '#bae7ff'}`,
                  fontWeight: 500,
                }}
              >
                <EyeOutlined
                  style={{
                    color: mode === ReviewMode.Edit ? '#fa8c16' : '#1890ff',
                  }}
                />
                <Text type="secondary" strong>
                  {mode === ReviewMode.Edit
                    ? 'Review Mode - Editing'
                    : 'Read-only Mode'}
                </Text>
              </Tag>
            </span>
          </div>
        </div>

        <Title level={4}>Contribution from {active?.changeSet.author}</Title>

        <div className="contribute-content">
          {empty && active?.changeSet && (
            <ContributionForm
              entity={empty}
              contribution={active}
              onChange={(
                contribuition: Contribution | TransformedContribution,
              ) => {
                const updatedChangeSet =
                  contribuition as TransformedContribution;
                setActive((prev) => ({
                  ...updatedChangeSet,
                  voyageId: prev?.changeSet.id || updatedChangeSet.voyage_id,
                  author:
                    prev?.changeSet.author || updatedChangeSet.changeSet.author,
                  status: prev?.status || updatedChangeSet.status,
                }));
              }}
              accessLevel={PropertyAccessLevel.Editor}
              contributionId={contributionId}
              currentStatus={currentStatus}
              mode={mode}
              onStartReview={handleStartReview}
              onCommitReview={handleReviewSubmit}
              onAbandonReview={handleReviewCancel}
              onEditorialDecision={handleOnEditorialDecision}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Box style={{ paddingTop: '16px', paddingBottom: '16px', width: '100%' }}>
      <ListEditorialPlatForm />
      <div
        style={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '12px 12px 4px 4px',
          padding: '12px',
          marginBottom: '12px',
          border: '1px solid #e8f0fe',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, color: '#333' }}>
              Edit Requests
            </Title>
            <div style={{ marginTop: '4px', color: '#6b7280' }}>
              Manage and review Edit Requests
            </div>
          </div>

          <Space size="middle">
            <SearchInput
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
            {hasActiveFilters && (
              <ActiveFiltersTag
                count={activeFilterCount}
                onClose={handleClearFilters}
              />
            )}
            <FilterToggleButton
              showFilters={showFilters}
              onClick={() => setShowFilters(!showFilters)}
            />
            <Button
              icon={<SettingOutlined />}
              onClick={() => setBatchManagementVisible(true)}
              style={{
                borderRadius: '6px',
                height: '30px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Batch Management
            </Button>
          </Space>
        </div>
      </div>{' '}
      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <Card
          style={{
            marginBottom: '16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            background: '#f8fafc',
          }}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Badge
                count={selectedRows.length}
                style={{ backgroundColor: '#1890ff' }}
              />
              <span style={{ marginLeft: '8px', fontWeight: 500 }}>
                {selectedRows.length} contribution(s) selected
              </span>
            </div>
            <Space>
              <Dropdown
                menu={{ items: bulkActionsMenuItems }}
                trigger={['click']}
              >
                <Button
                  type="primary"
                  style={{
                    background:
                      'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                  }}
                >
                  Bulk Actions <DownOutlined />
                </Button>
              </Dropdown>
              <Button
                size="small"
                onClick={() => {
                  gridRef.current?.api.deselectAll();
                  setSelectedRows([]);
                }}
              >
                Clear Selection
              </Button>
            </Space>
          </div>
        </Card>
      )}
      {/* Filters */}
      {showFilters && (
        <FilterPanel
          batches={batches}
          filters={filters}
          form={form}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}
      {/* Table */}
      <div
        className="ag-theme-alpine compact-table"
        style={{
          height: 'calc(90vh - 280px)',
          width: openSideBar ? 'calc(100vw - 340px)' : 'calc(100vw - 120px)',
          border: '1px solid #d9d9d9',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        <AgGridReact<TransformedContribution>
          theme="legacy"
          ref={gridRef}
          rowData={contribs}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          selectionColumnDef={selectionColumnDef}
          getRowStyle={getRowRowStyle}
          enableBrowserTooltips={true}
          paginationPageSize={rowsPerPage}
          onRowClicked={handleRowClick}
          pagination={true}
          suppressPaginationPanel={true}
          getRowClass={(params) =>
            params.rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
          }
          headerHeight={36}
          suppressHorizontalScroll={false}
          rowSelection={{
            mode: 'multiRow',
            checkboxes: true,
            enableClickSelection: false,
            headerCheckbox: false,
          }}
          onSelectionChanged={onSelectionChanged}
        />
      </div>
      {/* Pagination */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Pagination
          current={page}
          total={totalResultsCount}
          pageSize={rowsPerPage}
          showSizeChanger
          showTotal={(total, range) =>
            `Showing ${range[0]}-${range[1]} of ${total} contributions`
          }
          pageSizeOptions={['5', '10', '20', '50', '100']}
          onChange={handlePageChange}
          onShowSizeChange={handlePageChange}
          style={{ margin: 0 }}
        />
      </div>
      {/* Batch Management Modal */}
      <BatchManagement
        visible={batchManagementVisible}
        onClose={() => setBatchManagementVisible(false)}
        onBatchAssigned={() => {
          setRefreshTrigger((prev) => prev + 1);
          message.success('Batch updated successfully');
        }}
      />
      {/* Batch Assignment Modal */}
      <BatchAssignmentModal
        visible={batchAssignmentVisible}
        onClose={() => setBatchAssignmentVisible(false)}
        contributionIds={selectedRows}
        onSuccess={() => {
          setBatchAssignmentVisible(false);
          setSelectedRows([]);
          gridRef.current?.api.deselectAll();
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
    </Box>
  );
};

export default EditorialPlatformTable;
