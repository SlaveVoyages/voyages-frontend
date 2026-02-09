/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from 'react';

import {
  DirectPropertyChange,
  MaterializedEntity,
  TextProperty,
  NumberProperty,
  BoolProperty,
} from '@slavevoyages/voyages-contribute';
import { Input } from 'antd';

import { EntityFormProps } from './EntityForm';
import { EntityPropertyChangeCommentBox } from './EntityPropertyChangeCommentBox';

export interface DirectEntityPropertyFieldProps {
  property: TextProperty | NumberProperty | BoolProperty;
  entity: MaterializedEntity;
  lastChange?: DirectPropertyChange;
  onChange: EntityFormProps['onChange'];
}

export const lowerCaseFirstLetter = (s: string) =>
  s.length > 0 ? s[0].toLocaleLowerCase() + s.slice(1) : s;

export const DirectEntityPropertyField = ({
  property,
  entity,
  lastChange,
  onChange,
}: DirectEntityPropertyFieldProps) => {
  const { kind, label } = property;
  const [comments, setComments] = useState<string | undefined>();
  const value = lastChange
    ? lastChange.changed
    : ((entity.data[label] ?? null) as DirectPropertyChange['changed']);

  const handleChange = useCallback(
    (changed: DirectPropertyChange['changed']) => {
      if (
        changed === (lastChange?.changed ?? value) &&
        comments === lastChange?.comments
      ) {
        return;
      }
      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            kind: 'direct',
            property: property.uid,
            changed,
            comments,
          },
        ],
      });
    },
    [onChange, entity, property, lastChange, value, comments],
  );

  useEffect(() => handleChange(value), [handleChange, value, comments]);
  if (
    value !== null &&
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    return (
      <span>BUG: Value type is incorrect for DirectEntityPropertyField</span>
    );
  }

  return (
    <>
      <Input
        className={`truncate-input ${lastChange ? 'changedEntityProperty' : ''}`}
        type={kind}
        placeholder={`Enter ${lowerCaseFirstLetter(label)}`}
        style={{ width: 'calc(100% - 20px)' }}
        value={value ?? ''}
        onChange={(e: any) => {
          handleChange(e.target.value);
        }}
      />
      <EntityPropertyChangeCommentBox
        property={property}
        current={lastChange?.comments}
        onComment={setComments}
      />
    </>
  );
};
