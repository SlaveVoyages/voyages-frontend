import { CSSProperties, useState } from 'react';

import {
  DownOutlined,
  EditOutlined,
  ThunderboltOutlined,
  UpOutlined,
} from '@ant-design/icons';
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
  ConfigProvider,
  Form,
  Input,
  message,
  Radio,
  Row,
  Segmented,
  Splitter,
  Typography,
} from 'antd';

import { fetchImpute } from '@/fetch/contributeFetch/fetchImpute';
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

  const [splitterMode, setSplitterMode] = useState<
    'split' | 'form' | 'changes'
  >('split');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isImputing, setIsImputing] = useState(false);

  const handleImpute = async () => {
    if (!props.contributionId) return;
    setIsImputing(true);
    try {
      await fetchImpute(props.contributionId);
      message.success('Imputation triggered successfully');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Imputation failed — try again';
      message.error(msg);
    } finally {
      setIsImputing(false);
    }
  };

  // Show for any contribution opened via the editorial platform.
  // Backend enforces role/status rules server-side.
  const showImputeButton = !!props.contributionId;

  return (
    <>
      {title && <h1 className="page-title-1">{title}</h1>}

      {/* Contribution details card */}
      <Form
        form={contributeForm}
        layout="vertical"
        onFinish={isSaveChange ? handleSaveChanges : handleSubmitChanges}
        style={{ marginBottom: 10 }}
      >
        <Card
          className="card-contribute"
          styles={{ body: { padding: detailsOpen ? '10px' : 0 } }}
          title={
            <div className="contribute-edit-header">
              <span>
                {isReviewMode ? 'Review Details' : 'Contribution Details'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {showImputeButton && (
                  <Button
                    icon={<ThunderboltOutlined />}
                    loading={isImputing}
                    onClick={handleImpute}
                    size="small"
                    style={{
                      background: '#fa8c16',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      borderRadius: 6,
                    }}
                  >
                    Impute
                  </Button>
                )}
                {isShowStartReview && (
                  <Button
                    icon={<EditOutlined />}
                    onClick={handleStartReview}
                    disabled={isShowStartReviewDisable}
                    size="small"
                    style={{
                      background: '#fff',
                      color: 'rgb(55, 148, 141)',
                      border: 'none',
                      fontWeight: 600,
                      borderRadius: 6,
                    }}
                  >
                    Start Review
                  </Button>
                )}
              </div>
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
          extra={
            <Button
              size="small"
              icon={detailsOpen ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setDetailsOpen((v) => !v)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 6,
              }}
            >
              {detailsOpen ? 'Collapse' : 'Expand'}
            </Button>
          }
        >
          {detailsOpen && (
            <Row gutter={12}>
              <Col span={12}>
                {initAccessLevel === undefined && (
                  <Form.Item label="Contributor Mode" name="accessLevel">
                    <Radio.Group
                      value={accessLevel}
                      onChange={(e) => setAccessLevel(e.target.value)}
                      disabled={isReadOnlyMode}
                    >
                      {accessLevelOptions.map((opt) => (
                        <Radio key={opt.value} value={opt.value}>
                          {opt.label}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                )}
              </Col>
              <Col span={24}>
                <Form.Item
                  label={
                    isReviewMode ? 'Review Comments' : 'Contribution Comments'
                  }
                  name="comments"
                >
                  <Input.TextArea
                    rows={3}
                    disabled={isReadOnlyMode}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>
      </Form>

      {/* Entity form + changes summary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
          padding: '8px 12px',
          background: '#f0f6f6',
          borderRadius: 8,
          border: '1px solid #b2d8d8',
        }}
      >
        <Text strong style={{ fontSize: 13, color: '#37948d' }}>
          View:
        </Text>
        <ConfigProvider
          theme={{
            components: {
              Segmented: {
                itemSelectedBg: 'rgb(55, 148, 141)',
                itemSelectedColor: '#ffffff',
                trackBg: '#ffffff',
              },
            },
          }}
        >
          <Segmented
            value={splitterMode}
            onChange={(v) => setSplitterMode(v as typeof splitterMode)}
            options={[
              { label: 'Form Top', value: 'form' },
              { label: 'Split', value: 'split' },
              { label: 'Changes Top', value: 'changes' },
            ]}
            style={{ fontWeight: 500 }}
          />
        </ConfigProvider>
        <Text
          type="secondary"
          style={{ fontSize: 12, marginLeft: 4, fontStyle: 'italic' }}
        >
          {splitterMode === 'split'
            ? 'Tip: Drag the bar between panels to adjust their size'
            : 'Tip: Drag the bar to adjust panel heights'}
        </Text>
      </div>

      {(() => {
        const panelStyle: CSSProperties = {
          flex: 1,
          overflow: 'hidden',
          ...(mode === ReviewMode.Edit ? ContributionSectionStyle : null),
        };

        const entityFormCard = (
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
        );

        const changesSummaryCard = (
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
        );

        if (splitterMode === 'form') {
          return (
            <Splitter layout="vertical" style={panelStyle}>
              <Splitter.Panel defaultSize="65%" min="40%">
                {entityFormCard}
              </Splitter.Panel>
              <Splitter.Panel min="20%">{changesSummaryCard}</Splitter.Panel>
            </Splitter>
          );
        }
        if (splitterMode === 'changes') {
          return (
            <Splitter layout="vertical" style={panelStyle}>
              <Splitter.Panel defaultSize="65%" min="40%">
                {changesSummaryCard}
              </Splitter.Panel>
              <Splitter.Panel min="20%">{entityFormCard}</Splitter.Panel>
            </Splitter>
          );
        }
        return (
          <Splitter style={panelStyle}>
            <Splitter.Panel defaultSize="50%" min="30%" max="70%">
              {entityFormCard}
            </Splitter.Panel>
            <Splitter.Panel>{changesSummaryCard}</Splitter.Panel>
          </Splitter>
        );
      })()}

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
