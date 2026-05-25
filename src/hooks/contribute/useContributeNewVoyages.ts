import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Contribution,
  MaterializedEntity,
  getSchema,
  materializeNew,
} from '@slavevoyages/voyages-contribute';
import { AgGridReact } from 'ag-grid-react';
import { Form, message } from 'antd';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useColumnNewVoyagesDefs } from '@/components/PresentationComponents/Contribute/commons/useColumnDefs';
import { ReviewMode } from '@/components/PresentationComponents/Contribute/ContributionForm';
import {
  TransformedContribution,
  transformContributionData,
} from '@/components/PresentationComponents/Contribute/utils/transformContributionData';
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

export const useContributeNewVoyages = () => {
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
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  const {
    setContributions,
    contributions,
    setSelectedContribution,
    updateFormEntity,
  } = useVoyageContribution();

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      cellStyle: { paddingTop: '12px', fontSize: '13px' },
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

  const fetchContributions = useCallback(async () => {
    const params = buildNewVoyagesFilterQuery();
    setIsLoadingTable(true);
    try {
      const response = await fetchContributionsDataByAuthor(params);
      const transformed = (response?.data || []).map(transformContributionData);
      setContributions(transformed);
    } catch {
      message.error('Failed to fetch contributions');
    } finally {
      setIsLoadingTable(false);
    }
  }, [buildNewVoyagesFilterQuery, setContributions]);

  useEffect(() => {
    const state = location.state as { reload?: boolean };
    if (state?.reload && user?.email) {
      fetchContributions();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, user?.email, fetchContributions]);

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

  const handleEditContribution = useCallback(
    async (data: TransformedContribution) => {
      if (!data) return;
      const isExistingVoyage = data.root.type === 'existing';
      let entityToUse: MaterializedEntity;

      if (isExistingVoyage) {
        try {
          const res = await fetchSubmitEditVoaygesForm(String(data.root.id));
          entityToUse =
            res.status === 200 && res.data
              ? res.data
              : materializeNew(getSchema(data.root.schema), data.root.id);
        } catch {
          entityToUse = materializeNew(
            getSchema(data.root.schema),
            data.root.id,
          );
        }
      } else {
        entityToUse = materializeNew(getSchema(data.root.schema), data.root.id);
      }

      const editableContribution: Contribution = {
        ...data,
        root: {
          ...data.root,
          type: (isExistingVoyage ? 'existing' : 'new') as 'existing' | 'new',
        },
      };

      updateFormEntity(entityToUse);
      setSelectedContribution(editableContribution);
      navigate(`/contribute/interim/new/${data.id}`, {
        state: {
          formEntity: entityToUse,
          selectedContribution: editableContribution,
          formMode: ReviewMode.Edit,
        },
      });
    },
    [navigate, setSelectedContribution, updateFormEntity],
  );

  const handleDelete = useCallback(
    async (contributionId: string) => {
      try {
        await deleteContribution(contributionId);
        message.success('Contribution deleted successfully');
        fetchContributions();
      } catch {
        message.error('Failed to delete contribution');
      }
    },
    [fetchContributions],
  );

  const columnDefs = useColumnNewVoyagesDefs(
    handleEditContribution,
    handleDelete,
  );

  return {
    gridRef,
    form,
    contributions,
    isLoadingTable,
    contributePath,
    buttons,
    translatedContribute,
    handleClickSideBar,
    columnDefs,
    defaultColDef,
    getRowStyle,
  };
};
