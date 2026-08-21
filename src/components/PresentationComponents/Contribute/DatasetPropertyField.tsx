import { useState } from 'react';

import {
  DirectPropertyChange,
  MaterializedEntity,
  NumberProperty,
} from '@slavevoyages/voyages-contribute';
import { Select } from 'antd';

import { DATASET_OPTIONS } from '@/utils/contribute/datasets';

import { EntityFormProps } from './EntityForm';
import { EntityPropertyChangeCommentBox } from './EntityPropertyChangeCommentBox';

export interface DatasetPropertyFieldProps {
  property: NumberProperty;
  entity: MaterializedEntity;
  lastChange?: DirectPropertyChange;
  onChange: EntityFormProps['onChange'];
  readOnly?: boolean;
}

/**
 * Which database this voyage belongs to.
 *
 * Stored as a bare integer, and until now edited as one — an editor had to know
 * that 2 means Intra-African to record it, and nothing on the screen said so.
 * The codes are not derivable from the data: three can be read off the public
 * browse filters, and the fourth had to be asked.
 *
 * So the field is presented as the choice it actually is. The stored value is
 * unchanged; only the way it is picked differs.
 */
export const DatasetPropertyField = ({
  property,
  entity,
  lastChange,
  onChange,
  readOnly = false,
}: DatasetPropertyFieldProps) => {
  const [comments, setComments] = useState<string | undefined>();
  const stored = lastChange ? lastChange.changed : entity.data[property.label];

  // A new voyage arrives carrying the 0 `materializeNew` seeds into mandatory
  // numbers. Nothing was chosen, so nothing is shown as chosen -- offering
  // Trans-Atlantic as a pre-made answer would put a guess in the record.
  const nothingChosen =
    !lastChange && entity.entityRef.type === 'new' && stored === 0;
  const value =
    nothingChosen || stored === null || stored === undefined
      ? undefined
      : Number(stored);

  const handleChange = (chosen: number) => {
    onChange({
      type: 'update',
      entityRef: entity.entityRef,
      changes: [
        {
          kind: 'direct',
          property: property.uid,
          changed: String(chosen),
          comments,
        },
      ],
    });
  };

  return (
    <>
      <Select
        className={lastChange ? 'changedEntityProperty' : undefined}
        style={{ width: 'calc(100% - 20px)' }}
        placeholder="Select which database this voyage belongs to"
        value={value}
        onChange={handleChange}
        options={DATASET_OPTIONS}
        disabled={readOnly}
        status={value === undefined ? 'warning' : undefined}
      />
      <EntityPropertyChangeCommentBox
        property={property}
        current={lastChange?.comments}
        onComment={setComments}
      />
    </>
  );
};
