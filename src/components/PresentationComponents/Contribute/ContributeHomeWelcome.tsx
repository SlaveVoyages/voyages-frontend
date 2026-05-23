import '@/style/contributeContent.scss';
import '@/style/newVoyages.scss';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@mui/material';
import {
  materializeNew,
  MaterializedEntity,
  Contribution,
  getSchema,
} from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Form, Pagination, message, Spin } from 'antd';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  deleteContribution,
  fetchContributionsDataByAuthor,
} from '@/fetch/contributeFetch/fetchContributionsData';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';
import { useNavigation } from '@/hooks/useNavigation';
import { usePageRouter } from '@/hooks/usePageRouter';
import { useSearchEditRequestsFilters } from '@/hooks/useSearchEditRequestsFilters';
import { useVoyageContribution } from '@/hooks/useVoyageContribution';
import { RootState } from '@/redux/store';
import { getDisplayButtons } from '@/utils/functions/contribuitePath';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

import { useColumnNewVoyagesDefs } from './commons/useColumnDefs';
import { ReviewMode } from './ContributionForm';
import {
  TransformedContribution,
  transformContributionData,
} from './utils/transformContributionData';

const ContributeHomeWelcome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);

  const translatedContribute = translationLanguagesContribute(languageValue);
  const { contributePath } = usePageRouter();
  const { handleClickSideBar } = useNavigation();
  const buttons = getDisplayButtons(translatedContribute);

  const [form] = Form.useForm();
  const gridRef = useRef<AgGridReact<TransformedContribution>>(null);
  const { newVoyagesFilters, buildNewVoyagesFilterQuery } =
    useSearchEditRequestsFilters(form, gridRef);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [totalResultsCount, setTotalResultsCount] = useState(0);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<ReviewMode>(ReviewMode.Create);
  const [contributionId, setContributionId] = useState<string | undefined>('');

  // Use shared hook for contribution state management
  const {
    setContributions,
    contributions,
    setSelectedContribution,
    updateFormEntity,
  } = useVoyageContribution();

  // Load contribution by ID when id param exists (only for interim path)
  // For interim path, let NewVoyage handle the loading
  // For home page editing, handle it through handleEditContribution

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

  const getRowRowStyle = useCallback(
    () => ({
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#000',
      fontFamily: 'sans-serif',
    }),
    [],
  );

  // Fetch contributions data
  const fetchContributions = useCallback(async () => {
    const params = buildNewVoyagesFilterQuery();
    setIsLoadingTable(true);
    try {
      const response = await fetchContributionsDataByAuthor(params);
      const contributionsArray = response?.data || [];
      // Transform contributions (API already filters by author)
      const transformedContributions = contributionsArray.map(
        transformContributionData,
      );
      setContributions(transformedContributions);
      setTotalResultsCount(response?.total || transformedContributions.length);
    } catch (err) {
      console.error('Error fetching data:', err);
      message.error('Failed to fetch contributions');
    } finally {
      setIsLoadingTable(false);
    }
  }, [buildNewVoyagesFilterQuery, setContributions]);

  useEffect(() => {
    const state = location.state as { reload?: boolean; timestamp?: number };
    if (state?.reload) {
      // Fetch fresh data
      if (user?.email) {
        fetchContributions();
      }

      // Clear the state to prevent repeated reloads
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, user?.email, fetchContributions]);

  const handleEditContribution = useCallback(
    async (data: TransformedContribution) => {
      if (!data) return;
      setFormMode(ReviewMode.Edit);
      setContributionId(data.id);

      // Check if this is editing an existing voyage or creating a new one
      const isExistingVoyage = data.root.type === 'existing';

      let entityToUse: MaterializedEntity;

      if (isExistingVoyage) {
        // For existing voyages: Fetch the actual entity from the database
        try {
          const res = await fetchSubmitEditVoaygesForm(String(data.root.id));
          if (res.status === 200 && res.data) {
            entityToUse = res.data;
          } else {
            // Fallback to blank entity if fetch fails
            console.error(
              'Failed to fetch existing voyage, using blank entity',
            );
            entityToUse = materializeNew(
              getSchema(data.root.schema),
              data.root.id,
            );
          }
        } catch (error) {
          console.error('Error fetching existing voyage:', error);
          // Fallback to blank entity
          entityToUse = materializeNew(
            getSchema(data.root.schema),
            data.root.id,
          );
        }
      } else {
        // For "new" voyages: Create blank entity
        // The ContributionForm will apply changes via stackedEntity memo
        entityToUse = materializeNew(getSchema(data.root.schema), data.root.id);
      }

      updateFormEntity(entityToUse);
      // Keep the contribution with all its changes intact
      // ContributionForm's stackedEntity will apply them for display
      const editableContribution: Contribution = {
        ...data,
        root: {
          ...data.root,
          type: (isExistingVoyage ? 'existing' : 'new') as 'existing' | 'new',
        },
      };

      setSelectedContribution(editableContribution);
      setShowForm(true);
      // Pass the data through navigation state so NewVoyage can use it
      navigate(`/contribute/interim/new/${data?.id}`, {
        state: {
          formEntity: entityToUse,
          selectedContribution: editableContribution,
          formMode: ReviewMode.Edit,
        },
      });
    },
    [navigate, setSelectedContribution, updateFormEntity],
  );

  // Handle delete contribution
  const handleDelete = useCallback(
    async (contributionId: string) => {
      try {
        await deleteContribution(contributionId);
        message.success('Contribution deleted successfully');
        fetchContributions();
      } catch (error) {
        console.error('Error deleting contribution:', error);
        message.error('Failed to delete contribution');
      }
    },
    [fetchContributions],
  );

  // Define column definitions with handlers
  const columnDefs = useColumnNewVoyagesDefs(
    handleEditContribution,
    handleDelete,
  );

  // Fetch contributions on mount and when filters change
  useEffect(() => {
    if (user?.email && !contributePath) {
      fetchContributions();
    }
  }, [
    newVoyagesFilters,
    buildNewVoyagesFilterQuery,
    user?.email,
    contributePath,
    fetchContributions,
  ]);

  // Only render when we're at the contribute home page (no specific path)
  // When contributePath === 'interim', ContributeContent will render NewVoyage directly
  if (contributePath) {
    return null;
  }

  return (
    <div className="contribute-content">
      <h1 className="page-title-1">
        {translatedContribute.contributeContributeHomeWelcome}
      </h1>

      <div style={{ margin: '10px 0 24px 0' }}>
        {buttons.map((btn) => (
          <Button
            onClick={() => handleClickSideBar(btn.path)}
            key={btn.nameBtn}
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              backgroundColor: 'rgb(55, 148, 141)',
              color: '#fff',
              marginRight: '0.5rem',
              height: 32,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(6, 186, 171, 0.83)',
              },
            }}
          >
            {btn.nameBtn}
          </Button>
        ))}
      </div>

      {isLoadingTable ? (
        <div
          style={{
            height: 'calc(60vh - 280px)',
            width: 'calc(100vw - 120px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '12px',
            backgroundColor: '#fafafa',
          }}
        >
          <Spin size="large" tip="Loading contributions...">
            <div style={{ height: '200px' }} />
          </Spin>
        </div>
      ) : (
        contributions.length > 0 && (
          <>
            <div
              className="ag-theme-alpine compact-table"
              style={{
                height: 'calc(60vh - 280px)',
                width: 'calc(100vw - 120px)',
                border: '1px solid #d9d9d9',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              }}
            >
              <AgGridReact<TransformedContribution>
                theme="legacy"
                ref={gridRef}
                rowData={contributions}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowStyle={getRowRowStyle}
                enableBrowserTooltips={true}
                paginationPageSize={rowsPerPage}
                pagination={true}
                suppressPaginationPanel={true}
                getRowClass={(params) =>
                  params.rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
                }
                headerHeight={36}
                suppressHorizontalScroll={false}
              />
            </div>
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
          </>
        )
      )}
    </div>
  );
};
export default ContributeHomeWelcome;
