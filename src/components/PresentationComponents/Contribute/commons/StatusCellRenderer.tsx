import React from 'react';

import { CheckOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons';
import { ContributionStatus } from '@dotproductdev/voyages-contribute';
import { Space, Tag, Popconfirm, message, Dropdown } from 'antd';

export const statusConfig: Record<
  ContributionStatus,
  { label: string; color: string }
> = {
  [ContributionStatus.WorkInProgress]: {
    label: 'Work In Progress',
    color: 'orange',
  },
  [ContributionStatus.Submitted]: {
    label: 'Submitted',
    color: 'blue',
  },
  [ContributionStatus.Accepted]: {
    label: 'Accepted',
    color: 'green',
  },
  [ContributionStatus.Rejected]: {
    label: 'Rejected',
    color: 'red',
  },
  [ContributionStatus.Published]: {
    label: 'Published',
    color: 'purple',
  },
};

interface StatusCellRendererProps {
  value?: ContributionStatus;
  data?: any; // Full row data
  onStatusChange?: (
    contributionId: string,
    newStatus: ContributionStatus,
  ) => void;
}

const StatusCellRenderer: React.FC<StatusCellRendererProps> = ({
  value,
  data,
  onStatusChange,
}) => {
  const statusKey =
    value! in statusConfig
      ? (value as ContributionStatus)
      : ContributionStatus.Submitted;
  const config = statusConfig[statusKey];

  const handleAccept = () => {
    if (onStatusChange && data?.id) {
      onStatusChange(data.id, ContributionStatus.Accepted);
      message.success('Contribution accepted successfully');
    }
  };

  const handleReject = () => {
    if (onStatusChange && data?.id) {
      onStatusChange(data.id, ContributionStatus.Rejected);
      message.success('Contribution rejected');
    }
  };

  const canMakeDecision =
    statusKey === ContributionStatus.Submitted && onStatusChange;

  const editorialMenuItems = [
    {
      key: 'accept',
      label: (
        <Popconfirm
          title="Accept this contribution?"
          description="This action will mark the contribution as accepted and cannot be undone."
          onConfirm={handleAccept}
          okText="Accept"
          cancelText="Cancel"
          okButtonProps={{
            style: { background: '#2c8b04', borderColor: '#2c8b04' },
          }}
        >
          <div
            style={{
              color: '#2c8b04',
              width: '100%',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <CheckOutlined style={{ marginRight: 6 }} />
            Accept
          </div>
        </Popconfirm>
      ),
    },
    {
      key: 'reject',
      label: (
        <Popconfirm
          title="Reject this contribution?"
          description="This action will mark the contribution as rejected and cannot be undone."
          onConfirm={handleReject}
          okText="Reject"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <div
            style={{
              color: '#ff4d4f',
              width: '100%',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <CloseOutlined style={{ marginRight: 6 }} />
            Reject
          </div>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {canMakeDecision ? (
        <Dropdown
          menu={{ items: editorialMenuItems }}
          trigger={['click']}
          placement="bottomLeft"
        >
          <Tag color={config.color} style={{ margin: 0, cursor: 'pointer' }}>
            {config.label} <DownOutlined />
          </Tag>
        </Dropdown>
      ) : (
        <Tag color={config.color} style={{ margin: 0 }}>
          {config.label}
        </Tag>
      )}
    </Space>
  );
};
export default StatusCellRenderer;
