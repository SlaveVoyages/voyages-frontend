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
} from 'antd';
import dayjs from 'dayjs';
import '@/style/table.scss';
import { Link, useNavigate, useParams } from 'react-router-dom';

const { Text } = Typography;
import '@/style/contributeContent.scss';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { fetchContributionsData } from '@/fetch/contributeFetch/fetchContributionsData';
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
import StatusCellRenderer from '../commons/StatusCellRenderer';
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
  const { batches } = useBatchManagement({
    autoFetch: true,
  });
  const { id } = useParams<{ id: string }>();
  const [active, setActive] = useState<ChangeSet | undefined>(undefined);
  const [contributionId, setContributionId] = useState<string>(id || '');
  const [currentStatus, setCurrentStatus] = useState<
    ContributionStatus | undefined
  >(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  // const [currentContribution, setCurrentContribution] = useState<Contribution | undefined>(undefined);
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

  // useEffect(() => {
  //   const fetchContributionById = async () => {
  //     if (contribteID) {
  //       try {
  //         const response = await fetchContributionsDataByID(contribteID);
  //         if (!response || !response.data) {
  //           throw new Error('Contribution not found');
  //         }

  //         const fetchedData = response.data;
  //         console.log({ fetchedData });

  //         setActive((prev) => {
  //           console.log({ prev });
  //           // If we have previous active data from row click, merge it
  //           if (prev) {
  //             return {
  //               ...prev,
  //               ...fetchedData,
  //               changes: fetchedData.changes || prev.changes || [],
  //             };
  //           }

  //           // If no previous data, use fetchedData directly
  //           return fetchedData;
  //         });
  //       } catch (err) {
  //         console.error('Error fetching contribution:', err);
  //         message.error('Failed to load contribution');
  //         navigate('/contribute/editor_main/requests');
  //       }
  //     }
  //   };

  //   fetchContributionById();
  // }, [contribteID, navigate]);

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
    // if (!active || !active.changes || !active.changes[0]) return undefined;
    if (!active) return undefined;
    const schema = active.changes[0].entityRef.schema;
    const id = active.changes[0].entityRef.id;
    return materializeNew(getSchema(schema), id);
  }, [active]);

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

  if (active) {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link to="/contribute/editor_main/requests">
            <Button
              onClick={() => {
                setActive(undefined);
              }}
              style={{
                height: '32px',
              }}
            >
              ← Back to Table
            </Button>
          </Link>
          {ReviewMode.ReadOnly && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'flex-end',
              }}
            >
              <EyeOutlined style={{ color: 'green' }} />
              <Text type="secondary">Read-only mode</Text>
            </div>
          )}
        </div>

        <Title level={4}>Contribution from {active?.author}</Title>

        <div className="contribute-content">
          {empty && active && (
            <ContributionForm
              entity={empty}
              changeSet={active}
              onChange={setActive}
              accessLevel={PropertyAccessLevel.Editor}
              contributionId={contributionId}
              currentStatus={currentStatus}
              mode={ReviewMode.ReadOnly}
              reviews={reviews}
              onStartReview={() => {
                console.log(
                  'Starting review for contribution:',
                  contributionId,
                );
              }}
              onCommitReview={(review: Review) => {
                console.log('Committing review:', review);
                setReviews((prev) => [...prev, review]);
                // TODO: Send review to backend
              }}
              onAbandonReview={() => {
                console.log('Abandoning review');
              }}
              onEditorialDecision={(
                decision: 'accept' | 'reject',
                comments?: string,
              ) => {
                console.log('Editorial decision:', decision, comments);
                const newStatus =
                  decision === 'accept'
                    ? ContributionStatus.Accepted
                    : ContributionStatus.Rejected;
                handleStatusChange(contributionId, newStatus, comments);
              }}
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
          onRowClicked={({ data, event }) => {
            if (!event) return;

            const target = event.target as HTMLElement;

            // Check if clicking on checkbox elements
            const isCheckboxClick =
              target.closest('.ag-selection-checkbox') ||
              target.closest('.ag-checkbox-input') ||
              target.closest('.ag-checkbox-input-wrapper');

            // Check if clicking on specific columns by checking cell attributes
            const cellElement = target.closest('.ag-cell');
            const colId = cellElement?.getAttribute('col-id');
            const isCheckboxColumn =
              !colId || colId === 'ag-Grid-SelectionColumn';
            const disabledColumns = ['status'];

            if (
              isCheckboxColumn ||
              (colId && disabledColumns.includes(colId))
            ) {
              return;
            }

            if (!isCheckboxClick && data) {
              setActive(data);
              setCurrentStatus(data.status);
              setContributionId(data.id);
              navigate(`/contribute/editor_main/requests/${data.id}`);
            }
          }}
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
