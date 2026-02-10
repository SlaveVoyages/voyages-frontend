/* eslint-disable prettier/prettier */
import { LockOutlined } from '@ant-design/icons';
import { ContributionStatus, Review } from '@slavevoyages/voyages-contribute';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Tag,
  Typography,
} from 'antd';

import { statusConfig } from './commons/StatusCellRenderer';
import { ReviewMode } from './ContributionForm';
const { Text } = Typography;
export interface ContributionEditDecisionProps {
  handleEditorialDecisionSubmit: () => void;
  setSelectedDecision: React.Dispatch<
    React.SetStateAction<'accept' | 'reject' | null>
  >;
  selectedDecision: 'accept' | 'reject' | null;
  decisionComments: string;
  setDecisionComments: React.Dispatch<React.SetStateAction<string>>;
  currentStatus: ContributionStatus | undefined;
  isReviewMode: boolean;
  mode?: ReviewMode;
  contributionId?: string;
  reviews?: Review[];
}

const ContributionEditDecision = ({
  handleEditorialDecisionSubmit,
  setSelectedDecision,
  selectedDecision,
  mode,
  setDecisionComments,
  decisionComments,
  contributionId,
  currentStatus,
  reviews = [],
  isReviewMode,
}: ContributionEditDecisionProps) => {
  return (
    <Form
      layout="vertical"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        justifyContent: 'space-around',
      }}
    >
      {contributionId && currentStatus !== undefined && (
        <Card
          title={
            <div className="status-and-decistion">
              <div>
                <Text strong>Editorial Decision </Text>
              </div>
              <div>
                <Text strong>Current Status: </Text>
                <Tag
                  color={statusConfig[currentStatus]?.color || '#1890ff'}
                  style={{
                    fontWeight: 500,
                  }}
                >
                  {statusConfig[currentStatus]?.label ||
                    ContributionStatus[currentStatus]}
                </Tag>
              </div>
              {reviews.length > 0 && (
                <div>
                  <Text type="secondary">Reviews: {reviews.length}</Text>
                </div>
              )}
            </div>
          }
          style={{ flexShrink: 0, marginTop: '12px' }}
          className="card-contribute-decision"
        >
          {mode === ReviewMode.ReadOnly &&
            !isReviewMode &&
            currentStatus === ContributionStatus.Submitted && (
            <Row gutter={12}>
              <Col span={8}>
                <Text strong>Decision:</Text>
                <Select
                  placeholder="Select decision"
                  style={{ width: '100%', marginTop: 4 }}
                  value={selectedDecision}
                  onChange={setSelectedDecision}
                  options={[
                    { label: 'Accept', value: 'accept' },
                    { label: 'Reject', value: 'reject' },
                  ]}
                />
              </Col>
              <Col span={12}>
                <Text strong>Comments:</Text>
                <Input.TextArea
                  placeholder="Add decision comments..."
                  rows={3}
                  style={{ marginTop: 4 }}
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                />
              </Col>
              <Col span={4} style={{ display: 'flex', alignItems: 'end' }}>
                <Button
                  type="primary"
                  block
                  onClick={handleEditorialDecisionSubmit}
                  disabled={!selectedDecision}
                  style={{
                    background:
                        selectedDecision === 'accept'
                          ? '#0958d9'
                          : selectedDecision === 'reject'
                            ? '#ff4d4f'
                            : undefined,
                    borderColor:
                        selectedDecision === 'accept'
                          ? '#0958d9'
                          : selectedDecision === 'reject'
                            ? '#ff4d4f'
                            : undefined,
                  }}
                >
                    Submit Decision
                </Button>
              </Col>
            </Row>
          )}
          {currentStatus === ContributionStatus.Accepted && (
            <Alert
              message="Reviews Locked"
              description={
                <>
                  <LockOutlined style={{ marginRight: 8 }} />
                  This contribution has been accepted. All review changes have been merged into the original contribution. No further reviews can be added.
                  {reviews.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        {reviews.length} review(s) were merged into the final version.
                      </Text>
                    </div>
                  )}
                </>
              }
              type="success"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
          {currentStatus === ContributionStatus.Rejected && (
            <Alert
              message="Contribution Rejected"
              description={
                <>
                  <LockOutlined style={{ marginRight: 8 }} />
                  This contribution has been rejected. No further reviews can be added.
                </>
              }
              type="error"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </Card>
      )}
    </Form>
  );
};
export default ContributionEditDecision;
