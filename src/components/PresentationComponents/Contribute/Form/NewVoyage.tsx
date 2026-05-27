import '@/style/contributeContent.scss';
import '@/style/newVoyages.scss';
import React, { useCallback, useEffect, useState } from 'react';

import {
  VoyageSchema,
  materializeNew,
  MaterializedEntity,
  Contribution,
  ContributionStatus,
  getSchema,
} from '@slavevoyages/voyages-contribute';
import { Divider } from 'antd';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { CustomLoadingOverlay } from '@/components/CommonComponts/CustomLoadingOverlay';
import { fetchContributionByIdForEditor } from '@/fetch/contributeFetch/fetchContributionsData';
import { fetchSubmitEditVoaygesForm } from '@/fetch/contributeFetch/fetchSubmitEditVoaygesForm';
import { usePageRouter } from '@/hooks/usePageRouter';
import { useVoyageContribution } from '@/hooks/useVoyageContribution';
import { RootState } from '@/redux/store';

import { ContributionFormWrapper } from '../commons/ContributionFormWrapper';
import PageBackHeader from '../commons/PageBackHeader';
import { ReviewMode } from '../ContributionForm';
import { TransformedContribution } from '../utils/transformContributionData';

export interface NewVoyageProps {
  showForm?: boolean;
  formEntity?: MaterializedEntity;
  selectedContribution?: Contribution | TransformedContribution;
  formMode?: ReviewMode;
  contributionId?: string;
  onBack?: () => void;
  onChange?: (
    contribution: Contribution | TransformedContribution | undefined,
  ) => void;
}

const NewVoyage: React.FC<NewVoyageProps> = ({
  showForm: externalShowForm,
  formEntity: externalFormEntity,
  selectedContribution: externalSelectedContribution,
  formMode: externalFormMode,
  contributionId: externalContributionId,
  onBack: externalOnBack,
  onChange: externalOnChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const { contributePath } = usePageRouter();

  const [internalShowForm, setInternalShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [internalFormMode, setInternalFormMode] = useState<ReviewMode>(
    ReviewMode.Create,
  );
  const [internalContributionId, setInternalContributionId] = useState<
    string | undefined
  >('');

  // Use shared hook for contribution state management
  const {
    selectedContribution: internalSelectedContribution,
    formEntity: internalFormEntity,
    setSelectedContribution,
    updateFormEntity,
    contributions,
  } = useVoyageContribution();

  // Determine which values to use (external props take precedence)
  const showForm = externalShowForm ?? internalShowForm;
  const formEntity = externalFormEntity ?? internalFormEntity;
  const selectedContribution =
    externalSelectedContribution ?? internalSelectedContribution;
  const formMode = externalFormMode ?? internalFormMode ?? ReviewMode.Create;
  const contributionId = externalContributionId ?? internalContributionId;

  // Load contribution by ID when id param exists
  useEffect(() => {
    const loadContribution = async () => {
      // Check if data was passed through navigation state (from ContributeHomeWelcome)
      const navState = location.state as {
        formEntity?: MaterializedEntity;
        selectedContribution?: Contribution;
        formMode?: ReviewMode;
      };

      if (id && navState?.formEntity && navState?.selectedContribution) {
        // Use the data passed through navigation
        updateFormEntity(navState.formEntity);
        setSelectedContribution(navState.selectedContribution);
        setInternalFormMode(navState.formMode || ReviewMode.Edit);
        setInternalContributionId(id);
        setInternalShowForm(true);
        // Clear the navigation state to prevent stale data
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }

      // If data is already loaded in the shared hook (from ContributeHomeWelcome), use it
      if (id && internalSelectedContribution && internalFormEntity) {
        // Data is already loaded, just set the form mode
        setInternalFormMode(ReviewMode.Edit);
        setInternalContributionId(id);
        setInternalShowForm(true);
        return;
      }

      // Load from contributions array if available, otherwise fetch directly by ID (page reload case)
      if (id && user?.email) {
        let contribution: Contribution | undefined = contributions.find(
          (c) => c.id === id,
        );

        // On page reload the contributions array is empty — fetch directly from API
        if (!contribution) {
          setIsLoading(true);
          try {
            contribution = await fetchContributionByIdForEditor(id);
          } catch (err) {
            console.error('Error fetching contribution by ID:', err);
            setIsLoading(false);
            return;
          }
        }

        if (contribution) {
          setInternalFormMode(ReviewMode.Edit);
          setInternalContributionId(id);

          const isExistingVoyage = contribution.root.type === 'existing';
          let entityToUse: MaterializedEntity;

          if (isExistingVoyage) {
            try {
              const res = await fetchSubmitEditVoaygesForm(
                String(contribution.root.id),
              );
              entityToUse =
                res.status === 200 && res.data
                  ? res.data
                  : materializeNew(
                      getSchema(contribution.root.schema),
                      contribution.root.id,
                    );
            } catch {
              entityToUse = materializeNew(
                getSchema(contribution.root.schema),
                contribution.root.id,
              );
            }
          } else {
            entityToUse = materializeNew(
              getSchema(contribution.root.schema),
              contribution.root.id,
            );
          }

          updateFormEntity(entityToUse);
          setSelectedContribution({
            ...contribution,
            root: {
              ...contribution.root,
              type: (isExistingVoyage ? 'existing' : 'new') as
                | 'existing'
                | 'new',
            },
          });
          setInternalShowForm(true);
          setIsLoading(false);
        }
      }
    };

    loadContribution();
  }, [
    id,
    user?.email,
    contributions,
    internalSelectedContribution,
    internalFormEntity,
    setSelectedContribution,
    updateFormEntity,
    location.state,
    location.pathname,
    navigate,
  ]);

  // Handle new voyage button click
  const handleNewVoyageClick = useCallback(() => {
    const newEntity = materializeNew(VoyageSchema, uuidv4());

    const newContribution: Contribution = {
      id: String(newEntity.entityRef.id),
      root: newEntity.entityRef,
      changeSet: {
        id: uuidv4(),
        author: user?.email || '',
        title: '',
        comments: '',
        timestamp: new Date().getTime(),
        changes: [],
      },
      status: ContributionStatus.WorkInProgress,
      reviews: [],
      media: [],
    };
    setInternalContributionId(String(newEntity.entityRef.id));
    updateFormEntity(newEntity);
    setSelectedContribution(newContribution);
    setInternalFormMode(ReviewMode.Create);
    setInternalShowForm(true);
  }, [user?.email, setSelectedContribution, updateFormEntity]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    if (externalOnBack) {
      externalOnBack();
    } else {
      setInternalShowForm(false);
      setSelectedContribution(undefined);
      updateFormEntity(undefined);
      navigate('/contribute', { replace: true });
    }
  }, [externalOnBack, navigate, setSelectedContribution, updateFormEntity]);

  // Handle contribution form change
  const handleContributionChange = useCallback(
    (contribution: Contribution | TransformedContribution | undefined) => {
      if (externalOnChange) {
        externalOnChange(contribution);
      } else {
        setSelectedContribution(contribution);
      }
    },
    [externalOnChange, setSelectedContribution],
  );

  // Handle location state reload
  useEffect(() => {
    const state = location.state as { reload?: boolean; timestamp?: number };
    if (state?.reload) {
      // Reset form state
      setInternalShowForm(false);
      setSelectedContribution(undefined);
      updateFormEntity(undefined);
      setInternalContributionId('');

      // Clear the state to prevent repeated reloads
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, updateFormEntity, setSelectedContribution]);

  // If no form is shown and user navigates directly to /contribute/interim/new/
  // Create a new voyage form automatically
  useEffect(() => {
    if (contributePath === 'interim' && !showForm && !id && user?.email) {
      handleNewVoyageClick();
    }
  }, [contributePath, showForm, id, user?.email, handleNewVoyageClick]);

  if (showForm && formEntity && selectedContribution) {
    return (
      <>
        <div className="contribute-content" style={{ width: '100%' }}>
          <PageBackHeader
            title="New Voyage"
            onBack={handleBackClick}
            backTooltip="Back to Home"
          />

          <Divider style={{ margin: '12px 0' }} />
          <ContributionFormWrapper
            entity={formEntity}
            contribution={selectedContribution}
            onChange={handleContributionChange}
            mode={formMode}
            contributionId={contributionId}
            currentStatus={
              formMode === ReviewMode.Edit
                ? selectedContribution?.status
                : ContributionStatus.WorkInProgress
            }
          />
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 200px)' }}>
        <CustomLoadingOverlay />
      </div>
    );
  }

  return null;
};

export default NewVoyage;
