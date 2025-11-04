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

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Tag color={config.color} style={{ margin: 0 }}>
        {config.label}
      </Tag>
    </Space>
  );
};
export default StatusCellRenderer;
