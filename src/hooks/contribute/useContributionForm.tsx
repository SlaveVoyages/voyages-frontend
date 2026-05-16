import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addToChangeSet,
  applyChanges,
  cloneEntity,
  combineChanges,
  Contribution,
  ContributionStatus,
  dropOrphans,
  EntityChange,
  expandMaterialized,
  getSchema,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
} from '@slavevoyages/voyages-contribute';
import { CollapseProps, Form, Modal, message } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { createSaveChangeContribution } from '@/fetch/contributeFetch/createSaveChangeContribution';
import { createSubmitChangeContribution } from '@/fetch/contributeFetch/createSubmitChangeContribution';
import { usePageRouter } from '@/hooks/usePageRouter';
import { RootState } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';
import { combineEntityChanges } from '@/utils/contribute/contributionChanges';

import {
  ReviewMode,
  ContributionFormProps,
} from '@/components/PresentationComponents/Contribute/ContributionForm';
import { TransformedContribution } from '@/components/PresentationComponents/Contribute/utils/transformContributionData';

export const useContributionForm = ({
  entity,
  contribution,
  onChange,
  changeSet: directChangeSet,
  accessLevel: initAccessLevel,
  contributionId,
  currentStatus,
  mode,
  onStartReview,
  onCommitReview,
  onAbandonReview,
  onEditorialDecision,
}: ContributionFormProps) => {
  const navigate = useNavigate();
  const { id: ID } = useParams<{ id: string }>();
  const { contributePath } = usePageRouter();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const translatedcontribute = translationLanguagesContribute(languageValue);

  const [contributeForm] = Form.useForm();

  const reviews = useMemo(
    () => contribution?.reviews ?? [],
    [contribution?.reviews],
  );

  const changeSet = useMemo(
    () =>
      contribution?.changeSet ??
      directChangeSet ?? {
        id: -1,
        changes: [],
        author: '',
        title: '',
        comments: '',
        timestamp: Date.now(),
      },
    [contribution?.changeSet, directChangeSet],
  );

  const schema = getSchema(entity.entityRef.schema);
  const isNewVoyages = contributePath === 'interim';

  // ── State ──────────────────────────────────────────────────────────────────
  const [accessLevel, setAccessLevel] = useState<PropertyAccessLevel>(
    initAccessLevel ?? PropertyAccessLevel.BeginnerContributor,
  );
  const [globalExpand, setGlobalExpand] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string[]>([]);
  const [sections, setSections] = useState<CollapseProps['items']>([]);
  const [isSaveChange, setIsSaveChange] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewEntity, setPreviewEntity] = useState<
    MaterializedEntity | undefined
  >(undefined);
  const [decisionComments, setDecisionComments] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<
    'accept' | 'reject' | null
  >(null);
  const [isReviewMode, setIsReviewMode] = useState(mode === ReviewMode.Review);
  const [reviewChanges, setReviewChanges] = useState<EntityChange[]>([]);
  const [preReviewState, setPreReviewState] = useState<Contribution | null>(
    null,
  );
  const [changeSetId, setChangeSetId] = useState<string>('');
  const [originalChanges, setOriginalChanges] = useState<EntityChange[]>(
    () => contribution?.changeSet?.changes || [],
  );

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReviewMode && contribution?.changeSet?.changes) {
      setOriginalChanges(contribution.changeSet.changes);
    }
  }, [contribution?.changeSet?.changes, isReviewMode]);

  useEffect(() => {
    setIsReviewMode(mode === ReviewMode.Review);
  }, [mode]);

  useEffect(() => {
    contributeForm.setFieldsValue({
      title: changeSet?.title,
      comments: changeSet?.comments,
      accessLevel: PropertyAccessLevel.BeginnerContributor,
    });
  }, [changeSet?.title, changeSet?.comments, contributeForm]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isReadOnlyMode = mode === ReviewMode.ReadOnly && !isReviewMode;

  const stackedEntity = useMemo(() => {
    if (!contributionId || isReadOnlyMode) return entity;
    try {
      const stackedEntityClone = cloneEntity(entity);
      const expandedEntity = expandMaterialized(stackedEntityClone);

      let allChanges: EntityChange[] = isReviewMode
        ? [...originalChanges]
        : [...(changeSet?.changes || [])];

      reviews.forEach((review) => {
        if (review.changeSet.changes?.length > 0) {
          allChanges = [...allChanges, ...review.changeSet.changes];
        }
      });

      if (isReviewMode && reviewChanges.length > 0) {
        allChanges = [...allChanges, ...reviewChanges];
      }

      const filteredChanges = combineEntityChanges(allChanges)
        .map((change) => {
          if (change.type !== 'update') return change;
          const updatedChanges = change.changes.filter(
            (propChange) =>
              !('ownedEntity' in propChange) ||
              (propChange as any).ownedEntity?.state !== 'original',
          );
          return updatedChanges.length === 0
            ? null
            : { ...change, changes: updatedChanges };
        })
        .filter(Boolean) as EntityChange[];

      if (filteredChanges.length > 0) {
        try {
          applyChanges(expandedEntity, filteredChanges);
        } catch {
          return entity;
        }
      }
      return stackedEntityClone;
    } catch {
      return entity;
    }
  }, [
    originalChanges,
    changeSet?.changes,
    contributionId,
    entity,
    reviews,
    isReviewMode,
    reviewChanges,
    isReadOnlyMode,
  ]);

  const accessLevelOptions = Object.entries(PropertyAccessLevel)
    .filter(
      ([key]) =>
        isNaN(Number(key)) &&
        key !== 'Hidden' &&
        key !== 'IntermediateContributor' &&
        !(isNewVoyages && key === 'Editor'),
    )
    .map(([label, value]) => ({
      label: label.replace(/([A-Z])/g, ' $1').trim(),
      value,
    }));

  const displayedChanges = isReviewMode ? reviewChanges : changeSet.changes;
  const isShowStartReview = mode === ReviewMode.ReadOnly && !isReviewMode;
  const isShowStartReviewDisable =
    currentStatus !== ContributionStatus.Submitted &&
    currentStatus !== ContributionStatus.WorkInProgress;
  const contributionSection = mode === ReviewMode.Create ? 'create' : 'default';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStartReview = useCallback(() => {
    setPreReviewState(contribution!);
    setIsReviewMode(true);
    setReviewChanges([]);
    onStartReview?.();
  }, [contribution, onStartReview]);

  const handleCommitReview = useCallback(() => {
    if (reviewChanges.length === 0) {
      message.warning('No changes to commit');
      return;
    }
    const comments = contributeForm.getFieldValue('comments') || '';
    const existingReviews = contribution?.reviews || [];
    const review: Review = {
      changeSet: {
        id: '-1',
        author: user?.email || 'current-user',
        title: changeSet?.title || '',
        comments,
        timestamp: new Date().getTime(),
        changes: reviewChanges,
      },
      stackOrder: existingReviews.length + 1,
    };

    if (onCommitReview) {
      onCommitReview(review);
    } else if (contribution) {
      onChange?.({ ...contribution, reviews: [...existingReviews, review] });
    }

    setIsReviewMode(false);
    setReviewChanges([]);
    setPreReviewState(null);
    message.success('Review committed successfully');
  }, [
    reviewChanges,
    changeSet?.title,
    contributeForm,
    onCommitReview,
    contribution,
    onChange,
    user?.email,
  ]);

  const handleCancelReview = useCallback(() => {
    Modal.confirm({
      title: 'Cancel Review',
      content:
        'Are you sure you want to cancel? All review changes will be lost.',
      onOk: () => {
        if (preReviewState) onChange?.(preReviewState);
        setIsReviewMode(false);
        setReviewChanges([]);
        setPreReviewState(null);
        onAbandonReview?.();
      },
    });
  }, [preReviewState, onChange, onAbandonReview]);

  const handleEditorialDecisionSubmit = useCallback(() => {
    if (!selectedDecision || !onEditorialDecision) return;
    Modal.confirm({
      title: `${selectedDecision === 'accept' ? 'Accept' : 'Reject'} this contribution?`,
      content: `Are you sure you want to ${selectedDecision} this contribution? This action cannot be undone.`,
      okText: selectedDecision === 'accept' ? 'Accept' : 'Reject',
      okButtonProps: {
        danger: selectedDecision === 'reject',
        style:
          selectedDecision === 'accept'
            ? { background: '#52c41a', borderColor: '#52c41a' }
            : undefined,
      },
      onOk: () => {
        onEditorialDecision(selectedDecision, decisionComments);
        setSelectedDecision(null);
        setDecisionComments('');
      },
    });
  }, [selectedDecision, decisionComments, onEditorialDecision]);

  const onChangesUpdate = useCallback(
    (newChange: EntityChange) => {
      setIsSaveChange(false);
      if (isReviewMode) {
        const next = addToChangeSet(reviewChanges, newChange);
        dropOrphans(next);
        const combined = combineEntityChanges(next);
        setReviewChanges(combined);
        onChange?.({
          ...contribution,
          changeSet: {
            ...(contribution?.changeSet || changeSet),
            changes: combined,
          },
        } as Contribution);
      } else {
        const next = addToChangeSet(changeSet?.changes, newChange);
        dropOrphans(next);
        const combined = combineEntityChanges(next);
        onChange?.({
          ...contribution,
          changeSet: { ...changeSet, changes: combined },
        } as Contribution);
      }
    },
    [contribution, isReviewMode, reviewChanges, changeSet, onChange],
  );

  const handlePreviewChanges = useCallback(() => {
    const changesToApply = isReviewMode ? reviewChanges : changeSet?.changes;
    combineChanges(changesToApply);
    const updated = cloneEntity(isReviewMode ? stackedEntity : entity);
    applyChanges(expandMaterialized(updated), changesToApply);
    setPreviewEntity(updated);
  }, [
    contributeForm,
    changeSet,
    isReviewMode,
    reviewChanges,
    stackedEntity,
    entity,
  ]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setIsSaveChange(false);
    try {
      const formValues = await contributeForm.validateFields();
      const changesToSubmit = isReviewMode ? reviewChanges : changeSet?.changes;
      const payload: Contribution = {
        id: contributionId ?? ID!,
        root: entity.entityRef,
        changeSet: {
          title: formValues.title || changeSet.title,
          comments: formValues.comments || changeSet.comments || '',
          timestamp: new Date().getTime(),
          changes: changesToSubmit,
          author: changeSet.author!,
          id: changeSetId,
        },
        status: ContributionStatus.WorkInProgress,
        reviews: contribution?.reviews || [],
        media: contribution?.media || [],
      };

      const response = await createSaveChangeContribution(payload);
      message.success('Changes saved successfully!');
      setIsSaveChange(true);
      setChangeSetId(String(response?.changeSet?.id ?? ''));

      if (isReviewMode) {
        setReviewChanges([]);
        setIsReviewMode(false);
      } else {
        onChange?.({
          ...response,
          reviews:
            response.reviews?.length > 0
              ? response.reviews
              : contribution?.reviews || [],
        });
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Failed to save changes.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitChanges = async () => {
    Modal.confirm({
      title: 'Submit Contribution',
      content:
        'Once you submit your contribution you will not be able to edit it further. Submit your contribution?',
      okText: 'Submit',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsSubmitting(true);
        try {
          const formValues = contributeForm.getFieldsValue();
          const changesToSubmit = isReviewMode
            ? reviewChanges
            : changeSet.changes;
          const payload: Contribution = {
            id: contributionId ?? ID!,
            root: entity.entityRef,
            changeSet: {
              title: formValues.title || changeSet.title,
              comments: formValues.comments || changeSet.comments || '',
              timestamp: new Date().getTime(),
              changes: changesToSubmit,
              author: changeSet.author || user?.email || '',
              id: changeSetId,
            },
            status: ContributionStatus.Submitted,
            reviews: contribution?.reviews || [],
            media: contribution?.media || [],
          };

          const response = await createSubmitChangeContribution(payload);
          message.success('Contribution submitted successfully!');
          setIsSaveChange(false);
          navigate('/contribute', {
            replace: true,
            state: { reload: true, timestamp: Date.now() },
          });

          if (isReviewMode) {
            setReviewChanges([]);
            setIsReviewMode(false);
          } else {
            onChange?.({
              ...response,
              reviews:
                response.reviews?.length > 0
                  ? response.reviews
                  : contribution?.reviews || [],
            });
          }
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : 'Failed to submit contribution.',
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const resetAllChanges = useCallback(() => {
    Modal.confirm({
      title: isReviewMode ? 'Cancel review?' : 'Reset all changes?',
      content: isReviewMode
        ? 'This will cancel the current review and discard all changes. Are you sure?'
        : 'This will clear all unsaved edits. Are you sure?',
      okText: isReviewMode ? 'Cancel Review' : 'Reset Changes',
      okButtonProps: { danger: true },
      onOk: () => {
        if (isReviewMode) {
          handleCancelReview();
        } else {
          onChange?.({
            ...contribution,
            changeSet: { ...changeSet, id: String(changeSet.id), changes: [] },
          } as Contribution);
          contributeForm.resetFields();
        }
      },
    });
  }, [
    contribution,
    changeSet,
    isReviewMode,
    handleCancelReview,
    onChange,
    contributeForm,
  ]);

  const toggleExpandAll = useCallback(() => {
    const allKeys = sections?.map((s) => s.key as string) ?? [];
    setExpandedMenu(globalExpand ? [] : allKeys);
    setGlobalExpand((prev) => !prev);
  }, [sections, globalExpand]);

  const handleDeletePropertyChange = useCallback(
    (propertyToDelete: string) => {
      const changesToUpdate = isReviewMode ? reviewChanges : changeSet.changes;
      const updatedChanges = changesToUpdate
        .map((entityChange) => {
          if (
            !('changes' in entityChange) ||
            !Array.isArray(entityChange.changes)
          )
            return entityChange;
          const updatedEntityChanges = entityChange.changes
            .map((propChange) => {
              if (
                !('changes' in propChange) ||
                !Array.isArray(propChange.changes)
              )
                return propChange;
              const filtered = propChange.changes.filter(
                (f) => f?.property !== propertyToDelete,
              );
              return filtered.length === 0
                ? null
                : { ...propChange, changes: filtered };
            })
            .filter(Boolean);
          return updatedEntityChanges.length === 0
            ? null
            : { ...entityChange, changes: updatedEntityChanges };
        })
        .filter(Boolean) as EntityChange[];

      if (isReviewMode) {
        setReviewChanges(updatedChanges);
        onChange?.({
          ...contribution,
          changeSet: {
            ...(contribution?.changeSet || changeSet),
            changes: updatedChanges,
          },
        } as Contribution);
      } else {
        onChange?.({
          ...contribution,
          changeSet: { ...changeSet, changes: updatedChanges },
        } as Contribution);
      }
    },
    [contribution, isReviewMode, reviewChanges, changeSet, onChange],
  );

  return {
    // Form
    contributeForm,
    schema,
    translatedcontribute,

    // State
    accessLevel,
    setAccessLevel,
    globalExpand,
    expandedMenu,
    setExpandedMenu,
    sections,
    setSections,
    isSaveChange,
    isSaving,
    isSubmitting,
    previewEntity,
    setPreviewEntity,
    decisionComments,
    setDecisionComments,
    selectedDecision,
    setSelectedDecision,
    isReviewMode,
    reviewChanges,

    // Derived
    reviews,
    changeSet,
    isNewVoyages,
    isReadOnlyMode,
    stackedEntity,
    accessLevelOptions,
    displayedChanges,
    isShowStartReview,
    isShowStartReviewDisable,
    contributionSection,
    initAccessLevel,

    // Handlers
    handleStartReview,
    handleCommitReview,
    handleCancelReview,
    handleEditorialDecisionSubmit,
    onChangesUpdate,
    handlePreviewChanges,
    handleSaveChanges,
    handleSubmitChanges,
    resetAllChanges,
    toggleExpandAll,
    handleDeletePropertyChange,
  };
};
