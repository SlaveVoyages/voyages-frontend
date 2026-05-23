import { CSSProperties } from 'react';

import { EditOutlined } from '@ant-design/icons';
import {
  Contribution,
  ContributionStatus,
  EntityChange,
  MaterializedEntity,
  PropertyAccessLevel,
  Review,
} from '@slavevoyages/voyages-contribute';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Splitter,
  Typography,
} from 'antd';

import { useContributionForm } from '@/hooks/contribute/useContributionForm';

import ChangesSummary from './ChangesSummary';
import ContributionEditDecision from './ContributionEditDecision';
import { EntityForm } from './EntityForm';
import PreviewChangeDialog from './PreviewChange/PreviewChangeDialog';
import { TransformedContribution } from './utils/transformContributionData';

const { Text } = Typography;

// ── Exported types & constants (used by other components) ───────────────────

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

// ── Component ───────────────────────────────────────────────────────────────

export const ContributionForm = (props: ContributionFormProps) => {
  const { title, currentStatus, contribution, mode } = props;

  const {
    contributeForm,
    schema,
    translatedcontribute,
    accessLevel,
    setAccessLevel,
    globalExpand,
    expandedMenu,
    setExpandedMenu,
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
    reviews,
    isReadOnlyMode,
    stackedEntity,
    accessLevelOptions,
    displayedChanges,
    isShowStartReview,
    isShowStartReviewDisable,
    contributionSection,
    initAccessLevel,
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
  } = useContributionForm(props);

  const sectionStyle =
    contributionSection === 'create'
      ? ContributionSectionStyleCreate
      : ContributionSectionStyle;

  return (
    <>
      {title && <h1 className="page-title-1">{title}</h1>}

      {/* Contribution details card */}
      <Form
        form={contributeForm}
        layout="vertical"
        onFinish={isSaveChange ? handleSaveChanges : handleSubmitChanges}
        style={{
          ...sectionStyle,
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
                    <div className="abandon-review">Cancel Review</div>
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

      {/* Entity form + changes summary */}
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
            styles={{ body: { padding: 8 } }}
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
            <div style={{ overflow: 'hidden', padding: 4, flex: 1 }}>
              <Form>
                <EntityForm
                  key={props.entity.entityRef.id}
                  schema={schema}
                  entity={isReviewMode ? stackedEntity : props.entity}
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
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ChangesSummary
                changes={displayedChanges}
                resetAllChanges={resetAllChanges}
                submitChanges={handleSubmitChanges}
                handleSaveChanges={handleSaveChanges}
                handlePreview={handlePreviewChanges}
                entity={isReviewMode ? stackedEntity : props.entity}
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

      {/* Editorial decision panel */}
      {(currentStatus === ContributionStatus.Submitted ||
        currentStatus === ContributionStatus.Accepted ||
        currentStatus === ContributionStatus.Rejected) && (
        <ContributionEditDecision
          handleEditorialDecisionSubmit={handleEditorialDecisionSubmit}
          setSelectedDecision={setSelectedDecision}
          selectedDecision={selectedDecision}
          mode={mode}
          setDecisionComments={setDecisionComments}
          decisionComments={decisionComments}
          contributionId={props.contributionId}
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
