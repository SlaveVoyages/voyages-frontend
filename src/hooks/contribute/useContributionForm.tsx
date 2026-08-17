import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

import {
  ReviewMode,
  ContributionFormProps,
} from '@/components/PresentationComponents/Contribute/ContributionForm';
import { createSaveChangeContribution } from '@/fetch/contributeFetch/createSaveChangeContribution';
import {
  createSubmitChangeContribution,
  SubmissionRejectedError,
} from '@/fetch/contributeFetch/createSubmitChangeContribution';
import {
  PublicationConflict,
  PublicationValidation,
} from '@/fetch/contributeFetch/publishApi';
import { usePageRouter } from '@/hooks/usePageRouter';
import { RootState } from '@/redux/store';
import { hasEditorRole } from '@/utils/auth/hasEditorRole';
import { combineEntityChanges } from '@/utils/contribute/contributionChanges';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

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
  onReopen,
}: ContributionFormProps) => {
  const navigate = useNavigate();
  const { id: ID } = useParams<{ id: string }>();
  const { contributePath } = usePageRouter();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const isEditor = hasEditorRole(user);
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
  const [localChanges, setLocalChanges] = useState<EntityChange[]>(
    () => changeSet.changes,
  );
  const [preReviewState, setPreReviewState] = useState<Contribution | null>(
    null,
  );
  const [changeSetId, setChangeSetId] = useState<string>('');
  // The id the server last gave this contribution.
  //
  // The edit-a-voyage screen passes no `contributionId` and its route carries
  // no `:id`, so there is nothing here that names the contribution until the
  // server has been asked to store it once. Saving with no id makes a new one,
  // so without remembering the answer a second save would file a second
  // contribution against the same voyage rather than updating the first.
  const [savedContributionId, setSavedContributionId] = useState<string>('');
  // A refused submission, held so the contributor can read the list of fields
  // and then go straight back to filling them in. Cleared by dismissing it,
  // not by the next keystroke — the list is what they are working from.
  const [submitBlocked, setSubmitBlocked] = useState<{
    conflicts: PublicationConflict[];
    validation: PublicationValidation[];
    reason: string;
  } | null>(null);
  const [originalChanges, setOriginalChanges] = useState<EntityChange[]>(
    () => contribution?.changeSet?.changes || [],
  );

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReviewMode && contribution?.changeSet?.changes) {
      setOriginalChanges(contribution.changeSet.changes);
    }
  }, [contribution?.changeSet?.changes, isReviewMode]);

  // Sync localChanges when a new contribution is loaded (changeSet.id changes)
  useEffect(() => {
    if (!isReviewMode) setLocalChanges(changeSet.changes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeSet.id]);

  useEffect(() => {
    setIsReviewMode(mode === ReviewMode.Review);
  }, [mode]);

  // Keep the latest sections available without making every accessLevel
  // effect re-fire whenever a panel is opened/closed elsewhere.
  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  // Selecting a contributor mode changes which fields are visible; expand
  // the first section so the change is actually noticeable instead of
  // silently happening behind a collapsed panel.
  useEffect(() => {
    const firstKey = sectionsRef.current?.[0]?.key as string | undefined;
    if (!firstKey) return;
    setExpandedMenu((prev) =>
      prev.includes(firstKey) ? prev : [...prev, firstKey],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessLevel]);

  useEffect(() => {
    contributeForm.setFieldsValue({
      comments: changeSet?.comments,
      accessLevel: PropertyAccessLevel.BeginnerContributor,
    });
  }, [changeSet?.comments, contributeForm]);

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
        key !== 'Editor',
    )
    .map(([label, value]) => ({
      label: label.replace(/([A-Z])/g, ' $1').trim(),
      value,
    }));

  const displayedChanges = isReviewMode ? reviewChanges : localChanges;
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
        title: '',
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

  /**
   * Send an accepted contribution back to Submitted so it can be worked on.
   *
   * An accepted contribution is read-only, which is right until it turns out to
   * be missing something publication requires — at that point nobody can fix it
   * and the whole batch it sits in is stuck. This is the way back.
   *
   * The confirm says what it costs. `changeContributionStatus` writes the
   * decider with every status change, so reopening records whoever reopened it
   * and the original acceptance — who made it and any comment on it — is gone.
   */
  const handleReopenForEditing = useCallback(() => {
    Modal.confirm({
      title: 'Reopen this contribution for editing?',
      content:
        'It goes back to Submitted, where it can be reviewed and edited again. ' +
        'The record of who accepted it, and any comment they left, is replaced ' +
        'by this reopening.',
      okText: 'Reopen',
      cancelText: 'Cancel',
      onOk: () => onReopen?.(),
    });
  }, [onReopen]);

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
        const next = addToChangeSet(localChanges, newChange);
        dropOrphans(next);
        const combined = combineEntityChanges(next);
        setLocalChanges(combined);
        onChange?.({
          ...contribution,
          changeSet: { ...changeSet, changes: combined },
        } as Contribution);
      }
    },
    [
      contribution,
      isReviewMode,
      reviewChanges,
      changeSet,
      localChanges,
      onChange,
    ],
  );

  const handlePreviewChanges = useCallback(() => {
    const changesToApply = isReviewMode ? reviewChanges : changeSet?.changes;
    combineChanges(changesToApply);
    const updated = cloneEntity(isReviewMode ? stackedEntity : entity);
    applyChanges(expandMaterialized(updated), changesToApply);
    setPreviewEntity(updated);
  }, [changeSet, isReviewMode, reviewChanges, stackedEntity, entity]);

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
          title: '',
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

      navigate('/contribute', {
        replace: true,
        state: { reload: true, timestamp: Date.now() },
      });
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
        setSubmitBlocked(null);
        try {
          const formValues = contributeForm.getFieldsValue();
          const changesToSubmit = isReviewMode
            ? reviewChanges
            : changeSet.changes;
          let payload: Contribution = {
            id: savedContributionId || contributionId || ID!,
            root: entity.entityRef,
            changeSet: {
              title: '',
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

          // Store the work before asking for it to be submitted.
          //
          // `change_status` moves the status and reads nothing else off the
          // body, so submitting straight from the form submitted whatever the
          // server already held. For a draft that had never been saved that was
          // nothing at all, and the contributor was told their contribution was
          // not found; for one saved earlier it was the older content, and the
          // edits on screen went unmentioned. Neither is something the button
          // said it would do, and Edit mode offers it before any save has
          // happened. Saving here makes the thing submitted the thing being
          // looked at -- which is also what makes submit-time validation
          // meaningful, since it is the stored contribution that gets checked.
          if (!isReviewMode) {
            const saved = await createSaveChangeContribution({
              ...payload,
              status: ContributionStatus.WorkInProgress,
            });
            setChangeSetId(String(saved?.changeSet?.id ?? ''));
            // Hold on to what the store called it, so a second attempt from
            // this same screen edits this contribution rather than filing
            // another one beside it.
            setSavedContributionId(String(saved?.id ?? ''));
            payload = {
              ...payload,
              ...saved,
              status: ContributionStatus.Submitted,
            };
          }

          const response = await createSubmitChangeContribution(payload);
          message.success('Contribution submitted successfully!');
          setIsSaveChange(false);
          navigate('/contribute/editor_main/requests', {
            replace: true,
            state: { submittedId: response.id },
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
          // A refusal is not a failure: the contribution was never submitted,
          // so it is still an editable draft and the fields it names can still
          // be filled in. Reporting it as "failed to submit" would send the
          // contributor looking for a fault instead of at the list.
          if (error instanceof SubmissionRejectedError) {
            setSubmitBlocked({
              conflicts: error.conflicts,
              validation: error.validation,
              reason: error.message,
            });
            // The save above landed even though the submission did not, so the
            // edits are stored rather than riding on this page staying open.
            setIsSaveChange(true);
          } else {
            message.error(
              error instanceof Error
                ? error.message
                : 'Failed to submit contribution.',
            );
          }
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
          setLocalChanges([]);
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
    originalChanges,
    isEditor,
    submitBlocked,
    dismissSubmitBlocked: () => setSubmitBlocked(null),

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
    handleReopenForEditing,
    onChangesUpdate,
    handlePreviewChanges,
    handleSaveChanges,
    handleSubmitChanges,
    resetAllChanges,
    toggleExpandAll,
    handleDeletePropertyChange,
  };
};
