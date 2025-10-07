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
  ChangeSet,
  ContributionStatus,
  getSchema,
  materializeNew,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
} from '@dotproductdev/voyages-contribute';
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
import dayjs from 'dayjs';
import '@/style/table.scss';
import { useNavigate, useParams } from 'react-router-dom';

const { Text } = Typography;
import '@/style/contributeContent.scss';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  fetchContributionsData,
  fetchContributionsDataByID,
} from '@/fetch/contributeFetch/fetchContributionsData';
import { submitReview } from '@/fetch/contributeFetch/submitReview';
import { updateContributionStatus } from '@/fetch/contributeFetch/updateContributionStatus';
import { useBatchManagement } from '@/hooks/useBatchManagement';
import { useSearchEditRequestsFilters } from '@/hooks/useSearchEditRequestsFilters';

import BatchManagement from '../BatchComponent/BatchManagement';
import BatchAssignmentModal from '../BatchComponent/Modal/BatchAssignmentModal';
import { ActiveFiltersTag } from '../commons/ActiveFiltersTag';
import { FilterPanel } from '../commons/FilterPanel';
import { FilterToggleButton } from '../commons/FilterToggleButton';
import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import { SearchInput } from '../commons/SearchInput';
import StatusCellRenderer, {
  statusConfig,
} from '../commons/StatusCellRenderer';
import { ContributionForm, ReviewMode } from '../ContributionForm';
import {
  transformContributionData,
  TransformedContribution,
} from '../utils/transformContributionData';

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

  const { batches } = useBatchManagement({
    autoFetch: true,
  });
  const [active, setActive] = useState<TransformedContribution | undefined>(
    undefined,
  );
  const [contributionId, setContributionId] = useState<string>(id || '');
  const [currentStatus, setCurrentStatus] = useState<
    ContributionStatus | undefined
  >(undefined);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [originalEntity, setOriginalEntity] = useState<
    MaterializedEntity | undefined
  >(undefined);
  const [mode, setMode] = useState(ReviewMode.ReadOnly);
  const [savedContributionState, setSavedContributionState] = useState<
    TransformedContribution | undefined
  >(undefined);
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
  console.log({ contribs });

  // TODO: GET By ID
  useEffect(() => {
    const fetchContributionById = async () => {
      if (contributionId) {
        try {
          const response = await fetchContributionsDataByID(contributionId);
          if (!response || !response.data) {
            throw new Error('Contribution not found');
          }

          const fetchedData = response.data;

          setActive((prev) => {
            // If we have previous active data from row click, merge it
            if (prev) {
              return {
                ...prev,
                ...fetchedData,
                changes: fetchedData.changes || prev.changes || [],
              };
            }

            // If no previous data, use fetchedData directly
            return fetchedData;
          });
        } catch (err) {
          console.error('Error fetching contribution:', err);
          message.error('Failed to load contribution');
          navigate('/contribute/editor_main/requests');
        }
      }
    };

    fetchContributionById();
  }, [contributionId, navigate]);

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, [filters, buildFilterQuery]);

  // Load contribution when ID in URL changes
  useEffect(() => {
    if (id && contribs.length > 0) {
      const contribution = contribs.find((c) => c.id === id);

      if (contribution && (!active || active.id !== id)) {
        console.log('Loading contribution:', id);
        setActive(contribution);
        setCurrentStatus(contribution.status);
        setSavedContributionState(contribution);
        setMode(ReviewMode.ReadOnly);
        setReviews([]); // TODO: Load reviews from backend

        if (contribution.changes && contribution.changes.length > 0) {
          const schema = contribution.changes[0].entityRef.schema;
          const entityId = contribution.changes[0].entityRef.id;
          const entity = materializeNew(getSchema(schema), entityId);
          setOriginalEntity(entity);
        }
      }
    } else if (!id) {
      // Clear state when no ID in URL
      if (active) {
        console.log('No ID in URL, clearing state');
        setActive(undefined);
        setOriginalEntity(undefined);
        setReviews([]);
        setCurrentStatus(undefined);
        setSavedContributionState(undefined);
        setMode(ReviewMode.ReadOnly);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, contribs]);

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
        console.log({ node: node.data });
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
      comment?: string,
    ) => {
      try {
        await updateContributionStatus(contributionId, newStatus, comment);

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

  const columnDefs = useMemo(
    () =>
      [
        {
          headerName: 'Title',
          field: 'title' as any,
          tooltipField: 'title',
          width: 200,
          sortable: true,
        },
        {
          headerName: 'Contributor',
          field: 'author' as any,
          valueGetter: (params: any) => params.data?.author || 'Unknown',
          width: 120,
          tooltipField: 'author',
        },
        {
          headerName: 'Comments',
          field: 'comments' as any,
          tooltipField: 'comments',
          width: 250,
          sortable: true,
        },
        {
          headerName: 'Batch',
          field: 'batch' as any,
          tooltipField: 'batch',
          valueGetter: (params: any) => {
            return (
              params.data?.batch?.title || params.data?.batch || 'Unassigned'
            );
          },
          width: 180,
          sortable: true,
        },
        {
          headerName: 'Date',
          field: 'timestamp' as any,
          valueFormatter: ({ value }: { value: number }) =>
            dayjs(value).format('MM/DD/YYYY'),
          width: 100,
          // sort: 'desc',
        },
        {
          headerName: 'Voyage ID',
          field: 'voyageId' as any,
          tooltipValueGetter: (params: any) =>
            `Voyage ID: ${params.data?.voyageId}`,
          width: 120,
          // sort: 'asc',
          sortable: true,
        },
        {
          headerName: 'Ship',
          field: 'shipName' as any,
          width: 150,
          tooltipField: 'shipName',
          sortable: true,
        },
        {
          headerName: 'Port of Departure',
          field: 'portOfDeparture' as any,
          tooltipField: 'portOfDeparture',
          width: 200,
          sortable: true,
        },
        {
          headerName: 'Nationality',
          field: 'nationality' as any,
          width: 120,
          flex: 1,
          tooltipField: 'nationality',
          sortable: true,
        },
        {
          headerName: 'Tonnage',
          field: 'tonnage' as any,
          width: 100,
          flex: 1,
          tooltipField: 'tonnage',
          sortable: true,
        },
        {
          headerName: 'Reviewer',
          field: undefined as any,
          valueGetter: () => 'David Ellis',
          width: 120,
          flex: 1,
          sortable: true,
        },
        {
          headerName: 'Status & Actions',
          field: 'status' as any,
          cellRenderer: StatusCellRenderer,
          cellRendererParams: (params: any) => ({
            onStatusChange: handleStatusChange,
            data: params.data,
          }),
          width: 180,
          flex: 1,
          sortable: true,
        },
      ] as any[],
    [handleStatusChange],
  );

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

    // If we have the original entity stored, use it (this handles the review mode case)
    if (originalEntity) {
      return originalEntity;
    }

    // Handle the normal case when active.changes exists
    if (active.changes && active.changes.length > 0) {
      const schema = active.changes[0].entityRef.schema;
      const id = active.changes[0].entityRef.id;
      return materializeNew(getSchema(schema), id);
    }

    // If no changes and no stored entity, we can't create an empty entity
    console.warn(
      'No changes or stored entity available - cannot create empty entity',
    );
    return undefined;
  }, [active, originalEntity]);

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

        if (active) {
          // Merge backend response with current contribution state
          const updatedContributionState: TransformedContribution = {
            ...active,
            // Update with backend response data
            // ...(response.title && { title: response.title }),
            // ...(response.comments && { comments: response.comments }),
            // Merge the new review changes with existing changes
            changes: [
              ...(active.changes || []),
              ...(review.changeSet.changes || []),
            ],
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

        // Don't change mode on error - keep in review mode so user can retry
      }
    },
    [reviews, active, id],
  );

  const handleReviewCancel = useCallback(() => {
    console.log('Cancelling review');

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

      // Create and store the original entity
      if (data.changes && data.changes.length > 0) {
        const schema = data.changes[0].entityRef.schema;
        const id = data.changes[0].entityRef.id;
        const entity = materializeNew(getSchema(schema), id);
        setOriginalEntity(entity);
      }

      navigate(`/contribute/editor_main/requests/${data.id}`);
    },
    [navigate],
  );

  const handleBackClick = useCallback(
    (e?: React.MouseEvent) => {
      console.log('Back button clicked');

      // Prevent default link behavior if event exists
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      console.log('Navigating back to table');

      // Navigate FIRST, before clearing state
      navigate('/contribute/editor_main/requests');

      // Then clear state after navigation
      // Use setTimeout to ensure navigation happens first
      setTimeout(() => {
        setActive(undefined);
        setOriginalEntity(undefined);
        setReviews([]);
        setCurrentStatus(undefined);
        setContributionId('');
        setSavedContributionState(undefined);
        setMode(ReviewMode.ReadOnly);
      }, 0);
    },
    [navigate],
  );

  const handleOnEditorialDecision = useCallback(
    (decision: 'accept' | 'reject', comments?: string) => {
      const newStatus =
        decision === 'accept'
          ? ContributionStatus.Accepted
          : ContributionStatus.Rejected;
      handleStatusChange(contributionId, newStatus, comments);
    },
    [contributionId, handleStatusChange],
  );

  const shouldShowDetail = id && active && active.id === id;
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

        <Title level={4}>Contribution from {active?.author}</Title>

        <div className="contribute-content">
          {empty && active && (
            <ContributionForm
              entity={empty}
              changeSet={active}
              onChange={(changeSet: ChangeSet | TransformedContribution) => {
                const updatedChangeSet = changeSet as TransformedContribution;
                setActive((prev) => ({
                  ...updatedChangeSet,
                  voyageId: prev?.voyageId || updatedChangeSet.voyageId,
                  author: prev?.author || updatedChangeSet.author,
                  status: prev?.status || updatedChangeSet.status,
                }));
              }}
              accessLevel={PropertyAccessLevel.Editor}
              contributionId={contributionId}
              currentStatus={currentStatus}
              mode={mode}
              reviews={reviews}
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
    <div style={{ paddingTop: '16px', paddingBottom: '16px', width: '100%' }}>
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
          handleApplyFilters();
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
          handleApplyFilters();
        }}
      />
    </div>
  );
};

export default EditorialPlatformTable;
/*

 id: string;
    author: string;
    title: string;
    comments: string;
    timestamp: number;
    changes: EntityChange[];
}

{
    "id": "Voyage.Voyage.500007",
    "root": {
        "id": "500007",
        "schema": "Voyage",
        "type": "new"
    },
    "status": 1,
    "batch": {
        "id": 1,
        "title": "Import of Voyage from C:\\Users\\domin\\Downloads\\IOA_Voyages.csv",
        "comments": "Batch created for import of Voyage from CSV file C:\\Users\\domin\\Downloads\\IOA_Voyages.csv",
        "published": null
    }
}
*/
