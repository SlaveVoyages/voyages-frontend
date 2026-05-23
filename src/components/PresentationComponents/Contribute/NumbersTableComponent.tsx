import React from 'react';

import {
  EntityChange,
  TableChange,
  MaterializedEntity,
  TableProperty,
} from '@slavevoyages/voyages-contribute';
import { Table } from 'antd';

import { useNumbersTableComponent } from '@/hooks/contribute/useNumbersTableComponent';
import '@/style/numberTable.scss';

import { getNumbersTableColumns } from './columns/numbersTableColumns';
import { EntityPropertyChangeCommentBox } from './EntityPropertyChangeCommentBox';

interface EditableTableProps {
  property: TableProperty;
  entity: MaterializedEntity;
  lastChange?: TableChange;
  onChange: (change: EntityChange) => void;
}

const NumbersTableComponent: React.FC<EditableTableProps> = ({
  property,
  entity,
  lastChange,
  onChange,
}) => {
  const {
    activeCell,
    setActiveCell,
    localChanges,
    handleCellChange,
    handleComment,
    dataSource,
  } = useNumbersTableComponent({ property, entity, lastChange, onChange });

  const columns = getNumbersTableColumns({
    activeCell,
    setActiveCell,
    localChanges,
    columns: property.columns,
    handleCellChange,
  });

  return (
    <div>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        scroll={{ x: 'max-content' }}
        size="small"
        footer={() => (
          <div className="comment-box-wrapper">
            <EntityPropertyChangeCommentBox
              property={property}
              current={lastChange?.comments}
              onComment={handleComment}
            />
          </div>
        )}
      />
    </div>
  );
};

export default NumbersTableComponent;
