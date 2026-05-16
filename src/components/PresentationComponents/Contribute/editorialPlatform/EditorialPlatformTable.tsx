/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CheckCircleOutlined,
  DownOutlined,
  EyeOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { Box } from '@mui/material';
import { CustomLoadingOverlay } from '@/components/CommonComponts/CustomLoadingOverlay';

import { useEditorialPlatformTable } from '@/hooks/contribute/useEditorialPlatformTable';

import BatchManagement from '../BatchComponent/BatchManagement';
import BatchAssignmentModal from '../BatchComponent/Modal/BatchAssignmentModal';
import { ActiveFiltersTag } from '../commons/ActiveFiltersTag';
import { FilterPanel } from '../commons/FilterPanel';
import { FilterToggleButton } from '../commons/FilterToggleButton';
import ListEditorialPlatForm from '../commons/ListEditorialPlatForm';
import { SearchInput } from '../commons/SearchInput';
import { statusConfig } from '../commons/StatusCellRenderer';
import { ContributionForm } from '../ContributionForm';
import { TransformedContribution } from '../utils/transformContributionData';

import '@/style/table.scss';
import '@/style/contributeContent.scss';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const { Text, Title } = Typography;

interface EditorialPlatformTableProps {
  openSideBar: boolean;
}

const EditorialPlatformTable: React.FC<EditorialPlatformTableProps> = ({
  openSideBar,
}) => {
  const {
    // Grid
    gridRef,
    onGridReady,
    columnDefs,
    defaultColDef,
    selectionColumnDef,
    getRowStyle,
    totalCount,

    // Contribution detail
    active,
    setActive,
    contributionId,
    currentStatus,
    mode,
    empty,
    shouldShowDetail,
    accessLevel,
    isLoading,

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
    handleReviewSubmit,
    handleReviewCancel,
    handleStartReview,
    handleRowClick,
    handleBackClick,
    handleOnEditorialDecision,
    handleGridRefresh,
    handleClearSelection,
  } = useEditorialPlatformTable();

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
        message.info('Bulk approval functionality coming soon');
      },
    },
  ];

  // ── Loading overlay (deep link / page refresh) ───────────────────────────
  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 200px)' }}>
        <CustomLoadingOverlay />
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {contributionId && currentStatus !== undefined && (
              <span>
                <Text strong>Status: </Text>
                <Tag
                  color={statusConfig[currentStatus]?.color || '#1890ff'}
                  style={{ fontWeight: 500 }}
                >
                  {statusConfig[currentStatus]?.label}
                </Tag>
              </span>
            )}
            <Tag
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f0f9ff',
                border: '1px solid #bae7ff',
                fontWeight: 500,
              }}
            >
              <EyeOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary" strong>
                Read-only Mode
              </Text>
            </Tag>
          </div>
        </div>

        <Title level={4}>Contribution from {active?.changeSet.author}</Title>

        <div className="contribute-content">
          {empty && active?.changeSet && (
            <ContributionForm
              entity={empty}
              contribution={active}
              onChange={(contribution) => {
                const updated = contribution as TransformedContribution;
                setActive((prev) => ({
                  ...updated,
                  voyageId: prev?.changeSet.id || updated.voyage_id,
                  author: prev?.changeSet.author || updated.changeSet.author,
                  status: prev?.status || updated.status,
                }));
              }}
              accessLevel={accessLevel}
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

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <Box style={{ paddingTop: '16px', paddingBottom: '16px', width: '100%' }}>
      <ListEditorialPlatForm />

      {/* Toolbar */}
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
              }}
            >
              Batch Management
            </Button>
          </Space>
        </div>
      </div>

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
              <Button size="small" onClick={handleClearSelection}>
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

      {/* Row count */}
      {totalCount > 0 && (
        <div
          style={{
            textAlign: 'right',
            marginBottom: '6px',
            color: '#6b7280',
            fontSize: '13px',
          }}
        >
          {totalCount.toLocaleString()} contribution
          {totalCount !== 1 ? 's' : ''} — scroll to load more
        </div>
      )}

      {/* Grid */}
      <div
        className="ag-theme-alpine compact-table"
        style={{
          height: 'calc(90vh - 220px)',
          width: openSideBar ? 'calc(100vw - 340px)' : 'calc(100vw - 120px)',
          border: '1px solid #d9d9d9',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        <AgGridReact<TransformedContribution>
          theme="legacy"
          ref={gridRef}
          rowModelType="infinite"
          cacheBlockSize={50}
          onGridReady={onGridReady}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          selectionColumnDef={selectionColumnDef}
          getRowStyle={getRowStyle}
          enableBrowserTooltips={true}
          onRowClicked={handleRowClick}
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

      {/* Modals */}
      <BatchManagement
        visible={batchManagementVisible}
        onClose={() => setBatchManagementVisible(false)}
        onBatchAssigned={() => {
          handleGridRefresh();
          message.success('Batch updated successfully');
        }}
      />
      <BatchAssignmentModal
        visible={batchAssignmentVisible}
        onClose={() => setBatchAssignmentVisible(false)}
        contributionIds={selectedRows}
        onSuccess={() => {
          setBatchAssignmentVisible(false);
          setSelectedRows([]);
          gridRef.current?.api.deselectAll();
          handleGridRefresh();
        }}
      />
    </Box>
  );
};

export default EditorialPlatformTable;
