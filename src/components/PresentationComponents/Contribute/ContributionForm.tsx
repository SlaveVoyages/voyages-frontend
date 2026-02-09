import {
  CSSProperties,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';

import { EditOutlined } from '@ant-design/icons';
import {
  addToChangeSet,
  combineChanges,
  dropOrphans,
  EntityChange,
  getSchema,
  applyChanges,
  cloneEntity,
  expandMaterialized,
  MaterializedEntity,
  PropertyAccessLevel,
  PropertyChange,
  ContributionStatus,
  Review,
  Contribution,
  EntityUpdate,
} from '@slavevoyages/voyages-contribute';
import {
  CollapseProps,
  Form,
  Row,
  Col,
  Input,
  Select,
  Card,
  Modal,
  Typography,
  Button,
  message,
  Splitter,
} from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { createSaveChangeContribution } from '@/fetch/contributeFetch/createSaveChangeContribution';
import { createSubmitChangeContribution } from '@/fetch/contributeFetch/createSubmitChangeContribution';
import { usePageRouter } from '@/hooks/usePageRouter';
import { RootState } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';

import ChangesSummary from './ChangesSummary';
import ContributionEditDecision from './ContributionEditDecision';
import { EntityForm } from './EntityForm';
import PreviewChangeDialog from './PreviewChange/PreviewChangeDialog';
import { TransformedContribution } from './utils/transformContributionData';

const { Text } = Typography;

export enum ReviewMode {
  Create = 'create',
  Edit = 'edit',
  ReadOnly = 'read-only',
  Review = 'review',
}

export const ContributionSectionStyle: CSSProperties = {
  height: 'calc(100vh - 275px)',
  scrollSnapAlign: 'start',
};
export const ContributionSectionStyleCreate: CSSProperties = {
  height: 'calc(100vh - 500px)',
  scrollSnapAlign: 'start',
};

function combineOwnedChanges(changes: PropertyChange[]): PropertyChange[] {
  const seen: Record<string, PropertyChange> = {};

  changes.forEach((change) => {
    seen[change.property] = change;
  });

  return Object.values(seen);
}

function combineEntityChanges(changes: EntityChange[]): EntityChange[] {
  const entityMap: Record<string, EntityUpdate> = {};
  const otherChanges: EntityChange[] = [];

  changes.forEach((change) => {
    if (change.type === 'update') {
      const key = `${change.entityRef.schema}_${change.entityRef.id}`;

      if (!entityMap[key]) {
        entityMap[key] = {
          ...change,
          changes: [],
        };
      }

      const propertyMap: Record<string, PropertyChange> = {};

      entityMap[key].changes.forEach((propChange) => {
        propertyMap[propChange.property] = propChange;
      });

      change.changes.forEach((propertyChange) => {
        if (propertyChange.kind === 'owned') {
          propertyMap[propertyChange.property] = {
            ...propertyChange,
            changes: propertyChange.changes
              ? combineOwnedChanges(propertyChange.changes)
              : [],
          };
        } else if (propertyChange.kind === 'direct') {
          propertyMap[propertyChange.property] = propertyChange;
        } else {
          propertyMap[propertyChange.property] = propertyChange;
        }
      });

      entityMap[key].changes = Object.values(propertyMap);
    } else {
      otherChanges.push(change);
    }
  });

  return [...Object.values(entityMap), ...otherChanges];
}

export interface ContributionFormProps {
  entity: MaterializedEntity;
  contribution?: Contribution;
  onChange?: (contribuition: Contribution | TransformedContribution) => void;
  changeSet?: {
    id: string;
    changes: EntityChange[];
    comments?: string;
    title?: string;
    author?: string;
  };
  accessLevel?: PropertyAccessLevel;
  contributionId?: string;
  currentStatus?: ContributionStatus;
  mode?: ReviewMode;
  onStartReview?: () => void;
  onCommitReview?: (review: Review) => void;
  onAbandonReview?: () => void;
  handleSaveChanges?: () => Promise<void>;
  onEditorialDecision?: (
    decision: 'accept' | 'reject',
    comments?: string,
  ) => void;
  title?: string;
}

export const ContributionForm = ({
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
  title,
}: ContributionFormProps) => {
  const navigate = useNavigate();
  const { id: ID } = useParams<{ id: string }>();
  // Support both contribution prop and direct changeSet prop
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
  const { contributePath } = usePageRouter();
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );

  const { user } = useSelector((state: RootState) => state.getAuthUserSlice);
  const translatedcontribute = translationLanguagesContribute(languageValue);
  const [contributeForm] = Form.useForm();
  const schema = getSchema(entity.entityRef.schema);
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
  // Track original changes - preserves the original contribution state during review
  const [originalChanges, setOriginalChanges] = useState<EntityChange[]>(
    () => contribution?.changeSet?.changes || [],
  );

  // Update originalChanges when contribution loads/changes (but not during active review)
  useEffect(() => {
    if (!isReviewMode && contribution?.changeSet?.changes) {
      setOriginalChanges(contribution.changeSet.changes);
    }
  }, [contribution?.changeSet?.changes, isReviewMode]);

  useEffect(() => {
    setIsReviewMode(mode === ReviewMode.Review);
  }, [mode]);

  const isNewVoyages = contributePath === 'interim';
  const isReadOnlyMode = mode === ReviewMode.ReadOnly && !isReviewMode;

  const stackedEntity = useMemo(() => {
    if (!contributionId) {
      return entity;
    }

    if (isReadOnlyMode) {
      return entity;
    }

    try {
      const stackedEntityClone = cloneEntity(entity);
      const expandedEntity = expandMaterialized(stackedEntityClone);

      let allChanges: EntityChange[] = isReviewMode
        ? [...originalChanges]
        : [...(changeSet?.changes || [])];

      reviews.forEach((review) => {
        if (review.changeSet.changes && review.changeSet.changes.length > 0) {
          allChanges = [...allChanges, ...review.changeSet.changes];
        }
      });

      if (isReviewMode && reviewChanges.length > 0) {
        allChanges = [...allChanges, ...reviewChanges];
      }

      const combinedChanges = combineEntityChanges(allChanges);

      const filteredChanges = combinedChanges
        .map((change) => {
          if (change.type === 'update') {
            const updatedChanges: PropertyChange[] = [];

            change.changes.forEach((propChange) => {
              if (propChange.kind === 'owned' && propChange.ownedEntity) {
                if (propChange.ownedEntity.state === 'original') {
                  return;
                }
                updatedChanges.push(propChange);
              } else {
                updatedChanges.push(propChange);
              }
            });

            if (updatedChanges.length === 0) {
              return null;
            }

            return {
              ...change,
              changes: updatedChanges,
            };
          }
          return change;
        })
        .filter((c) => c !== null) as EntityChange[];

      if (filteredChanges.length > 0) {
        try {
          applyChanges(expandedEntity, filteredChanges);
        } catch (applyError) {
          console.error('Error applying changes:', applyError);
          return entity;
        }
      }

      return stackedEntityClone;
    } catch (error) {
      console.error('Error computing stacked entity:', error);
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
        !(isNewVoyages && key === 'Editor'),
    )
    .map(([label, value]) => ({
      label: label.replace(/([A-Z])/g, ' $1').trim(),
      value,
    }));

  useEffect(() => {
    contributeForm.setFieldsValue({
      title: changeSet?.title,
      comments: changeSet?.comments,
      accessLevel: PropertyAccessLevel.BeginnerContributor,
    });
  }, [changeSet?.title, changeSet?.comments, contributeForm]);

  const handleStartReview = useCallback(() => {
    setPreReviewState(contribution!);
    setIsReviewMode(true);
    setReviewChanges([]);
    if (onStartReview) {
      onStartReview();
    }
  }, [contribution, onStartReview]);

  const handleCommitReview = useCallback(() => {
    if (reviewChanges.length === 0) {
      message.warning('No changes to commit');
      return;
    }

    const comments = contributeForm.getFieldValue('comments') || '';
    const existingReviews = contribution?.reviews || [];
    const nextStackOrder = existingReviews.length + 1;

    const review: Review = {
      changeSet: {
        id: -1,
        author: user?.email || 'current-user',
        title: changeSet?.title || '',
        comments: comments,
        timestamp: new Date().getTime(),
        changes: reviewChanges,
      },
      stackOrder: nextStackOrder,
    };

    if (onCommitReview) {
      onCommitReview(review);
    } else if (contribution) {
      // If no external handler, update the contribution with the new review
      const updatedContribution: Contribution = {
        ...contribution,
        id: contribution.id,
        root: contribution.root,
        changeSet: contribution.changeSet,
        status: contribution.status,
        reviews: [...existingReviews, review],
        media: contribution.media || [],
      };
      onChange?.(updatedContribution);
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
        if (preReviewState) {
          onChange?.(preReviewState);
        }
        setIsReviewMode(false);
        setReviewChanges([]);
        setPreReviewState(null);
        if (onAbandonReview) {
          onAbandonReview();
        }
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
        const nextReviewChanges = addToChangeSet(reviewChanges, newChange);
        dropOrphans(nextReviewChanges);
        const combined = combineEntityChanges(nextReviewChanges);
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
          changeSet: {
            ...changeSet,
            changes: combined,
          },
        } as Contribution);
      }
    },
    [contribution, isReviewMode, reviewChanges, changeSet, onChange],
  );

  const handlePreviewChanges = useCallback(() => {
    const formValues = contributeForm.getFieldsValue();
    console.log('Form Values:', formValues);
    const changesToApply = isReviewMode ? reviewChanges : changeSet?.changes;
    const combined = combineChanges(changesToApply);
    console.log('Flattened change set:', combined);

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
        id: contributionId ? contributionId : ID!,
        root: entity.entityRef,
        changeSet: {
          title: formValues.title || changeSet.title,
          comments: formValues.comments || changeSet.comments || '',
          timestamp: new Date().getTime(),
          changes: changesToSubmit,
          author: changeSet.author!,
          id: changeSetId ? Number(changeSetId) : Number(changeSet.id),
        },
        status: ContributionStatus.WorkInProgress,
        reviews: contribution?.reviews || [],
        media: contribution?.media || [],
      };

      const response = await createSaveChangeContribution(payload);

      message.success('Changes saved successfully!');
      setIsSaveChange(true);
      console.log({ changeSetID: response.changeSet });
      setChangeSetId(String(response?.changeSet?.id ?? ''));
      if (isReviewMode) {
        setReviewChanges([]);
        setIsReviewMode(false);
      } else {
        // Preserve local reviews if API response doesn't include them
        onChange?.({
          ...response,
          reviews:
            response.reviews?.length > 0
              ? response.reviews
              : contribution?.reviews || [],
        });
      }
    } catch (error) {
      console.error('Validation or save failed:', error);
      message.error(
        error instanceof Error
          ? error.message
          : 'Failed to save changes. Please check the form.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitChanges = async () => {
    Modal.confirm({
      title: 'Submit Contribution',
      content:
        'Once you submit your contribution you will not be able to edit it further. To resume editing, just save the data entry form and it will appear on the Contribute Home page. Submit your contribution?',
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
            id: contributionId ? contributionId : ID!,
            root: entity.entityRef,
            changeSet: {
              title: formValues.title || changeSet.title,
              comments: formValues.comments || changeSet.comments || '',
              timestamp: new Date().getTime(),
              changes: changesToSubmit,
              author: changeSet.author || user?.email || '',
              id: changeSetId ? Number(changeSetId) : Number(changeSet.id),
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
            // Preserve local reviews if API response doesn't include them
            onChange?.({
              ...response,
              reviews:
                response.reviews?.length > 0
                  ? response.reviews
                  : contribution?.reviews || [],
            });
          }
        } catch (error) {
          console.error('Submission failed:', error);
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
    const title = isReviewMode ? 'Cancel review?' : 'Reset all changes?';
    const content = isReviewMode
      ? 'This will cancel the current review and discard all changes. Are you sure?'
      : 'This will clear all unsaved edits. Are you sure?';

    Modal.confirm({
      title,
      content,
      okText: isReviewMode ? 'Cancel Review' : 'Reset Changes',
      okButtonProps: { danger: true },
      onOk: () => {
        if (isReviewMode) {
          handleCancelReview();
        } else {
          onChange?.({
            ...contribution,
            changeSet: {
              ...changeSet,
              changes: [],
            },
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

  const toggleExpandAll = () => {
    const allKeys = sections?.map((section) => section.key as string) ?? [];
    setExpandedMenu(globalExpand ? [] : allKeys);
    setGlobalExpand(!globalExpand);
  };

  const handleDeletePropertyChange = useCallback(
    (propertyToDelete: string) => {
      const changesToUpdate = isReviewMode ? reviewChanges : changeSet.changes;

      const updatedChanges: EntityChange[] = changesToUpdate
        .map((entityChange) => {
          if (
            'changes' in entityChange &&
            Array.isArray(entityChange.changes)
          ) {
            const updatedEntityChanges = entityChange.changes
              .map((propChange) => {
                if (
                  'changes' in propChange &&
                  Array.isArray(propChange.changes)
                ) {
                  const filteredFieldChanges = propChange.changes.filter(
                    (fieldChange) => fieldChange?.property !== propertyToDelete,
                  );

                  if (filteredFieldChanges.length === 0) return null;

                  return {
                    ...propChange,
                    changes: filteredFieldChanges,
                  };
                }
                return propChange;
              })
              .filter(Boolean);

            if (updatedEntityChanges.length === 0) return null;

            return {
              ...entityChange,
              changes: updatedEntityChanges,
            };
          }

          return entityChange;
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
          changeSet: {
            ...changeSet,
            changes: updatedChanges,
          },
        } as Contribution);
      }
    },
    [contribution, isReviewMode, reviewChanges, changeSet, onChange],
  );

  const displayedChanges = isReviewMode ? reviewChanges : changeSet.changes;

  const isShowStartReview =
    mode === ReviewMode.ReadOnly &&
    !isReviewMode &&
    (currentStatus === ContributionStatus.Submitted ||
      currentStatus === ContributionStatus.WorkInProgress);
  const isShowStartReviewDisable = ![
    ContributionStatus.Submitted,
    ContributionStatus.WorkInProgress,
  ].includes(currentStatus!);

  const contributionSection =
    mode === ReviewMode.Create
      ? ContributionSectionStyleCreate
      : ContributionSectionStyle;

  return (
    <>
      {title && <h1 className="page-title-1">{title}</h1>}
      <Form
        form={contributeForm}
        layout="vertical"
        onFinish={isSaveChange ? handleSaveChanges : handleSubmitChanges}
        style={{
          ...contributionSection,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          justifyContent: 'space-around',
          margin: '20px 0',
        }}
      >
        <Card
          title={
            <div className="contribute-edit-header">
              <span>
                {isReviewMode ? 'Review Details' : 'Contribution Details'}
              </span>
              {isShowStartReview && (
                <Button
                  icon={<EditOutlined />}
                  onClick={handleStartReview}
                  disabled={isShowStartReviewDisable}
                  type="primary"
                >
                  Start Review
                </Button>
              )}
              {isReviewMode && (
                <div className="action-review-btn">
                  <Button onClick={handleCancelReview} danger>
                    <div className="abandon-review"> Cancel Review </div>
                  </Button>
                  <Button
                    onClick={handleCommitReview}
                    type="primary"
                    disabled={reviewChanges.length === 0}
                  >
                    <div className="commit-review">
                      Commit Review ({reviewChanges.length} changes)
                    </div>
                  </Button>
                </div>
              )}
            </div>
          }
          className="card-contribute"
          style={{ flexShrink: 0 }}
          styles={{ body: { padding: '10px' } }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Contribution Title" name="title">
                <Input disabled={isReadOnlyMode} />
              </Form.Item>
            </Col>
            <Col span={12}>
              {initAccessLevel === undefined && (
                <Form.Item label="Contributor Mode" name="accessLevel">
                  <Select
                    options={accessLevelOptions}
                    style={{ width: '100%' }}
                    value={accessLevel}
                    onChange={(value: PropertyAccessLevel) =>
                      setAccessLevel(value)
                    }
                    disabled={isReadOnlyMode}
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={24}>
              <Form.Item
                label={
                  isReviewMode ? 'Review Comments' : 'Contribution Message'
                }
                name="comments"
              >
                <Input.TextArea rows={8} disabled={isReadOnlyMode} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
      <Splitter
        style={{
          flex: 1,
          overflow: 'hidden',
          ...(mode === ReviewMode.Edit ? ContributionSectionStyle : null),
        }}
      >
        <Splitter.Panel defaultSize="50%" min="30%" max="70%">
          <Card
            style={{
              height: '100%',
              overflow: 'auto',
              flexDirection: 'column',
              display: 'flex',
            }}
            styles={{
              body: {
                padding: 8,
              },
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                background: '#fff',
                padding: 10,
                borderBottom: '1px solid #f0f0f0',
                zIndex: 99,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text strong>{translatedcontribute.titleCollaps}</Text>
                <Button onClick={toggleExpandAll}>
                  {globalExpand
                    ? translatedcontribute.collapse
                    : translatedcontribute.expand}
                </Button>
              </div>
            </div>
            <div
              style={{
                overflow: 'hidden',
                padding: 4,
                flex: 1,
              }}
            >
              <Form>
                <EntityForm
                  key={entity.entityRef.id}
                  schema={schema}
                  entity={isReviewMode ? stackedEntity : entity}
                  changes={displayedChanges}
                  onChange={isReadOnlyMode ? () => {} : onChangesUpdate}
                  expandedMenu={expandedMenu}
                  setExpandedMenu={setExpandedMenu}
                  accessLevel={accessLevel}
                  onSectionsChange={setSections}
                  readOnly={isReadOnlyMode}
                />
              </Form>
            </div>
          </Card>
        </Splitter.Panel>

        <Splitter.Panel>
          <Card
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            styles={{
              body: {
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              },
            }}
          >
            <div
              style={{
                padding: 10,
                borderBottom: '1px solid #eee',
                background: '#fff',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Text strong>
                {isReviewMode ? 'Review Changes' : 'Changes Summary'}
              </Text>
              <Text type="secondary">
                {displayedChanges.length} change
                {displayedChanges.length !== 1 && 's'}
              </Text>
            </div>
            {isSaveChange && !isReviewMode && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#52c41a',
                }}
              >
                ✓ Changes saved. You can now submit your contribution.
              </div>
            )}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
              }}
            >
              <ChangesSummary
                changes={displayedChanges}
                resetAllChanges={resetAllChanges}
                submitChanges={handleSubmitChanges}
                handleSaveChanges={handleSaveChanges}
                handlePreview={handlePreviewChanges}
                entity={isReviewMode ? stackedEntity : entity}
                handleDeleteChange={handleDeletePropertyChange}
                isReviewMode={isReviewMode}
                onCommitReview={handleCommitReview}
                readOnly={isReadOnlyMode}
                currentStatus={currentStatus}
                isSaveChange={isSaveChange}
                isSaving={isSaving}
                isSubmitting={isSubmitting}
                mode={mode}
                contribution={contribution}
                currentReviewChanges={reviewChanges}
                originalChanges={originalChanges}
              />
            </div>
          </Card>
        </Splitter.Panel>
      </Splitter>
      {currentStatus === 1 && (
        <ContributionEditDecision
          handleEditorialDecisionSubmit={handleEditorialDecisionSubmit}
          setSelectedDecision={setSelectedDecision}
          selectedDecision={selectedDecision}
          mode={mode}
          setDecisionComments={setDecisionComments}
          decisionComments={decisionComments}
          contributionId={contributionId}
          currentStatus={currentStatus}
          reviews={reviews}
          isReviewMode={isReviewMode}
        />
      )}
      <PreviewChangeDialog
        previewEntity={previewEntity}
        open={previewEntity !== undefined}
        onClose={() => setPreviewEntity(undefined)}
      />
    </>
  );
};
