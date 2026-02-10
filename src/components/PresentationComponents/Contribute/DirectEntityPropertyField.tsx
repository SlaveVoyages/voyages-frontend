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

  // For number inputs, ensure the value is numeric to avoid browser warnings
  // Use type="text" for non-numeric values to prevent "cannot be parsed" errors
  const inputType =
    kind === 'number' &&
    typeof value === 'string' &&
    value !== '' &&
    isNaN(Number(value))
      ? 'text'
      : kind === 'bool'
        ? 'text'
        : kind;

  return (
    <>
      <Input
        className={`truncate-input ${lastChange ? 'changedEntityProperty' : ''}`}
        type={inputType}
        placeholder={`Enter ${lowerCaseFirstLetter(label)}`}
        style={{ width: 'calc(100% - 20px)' }}
        value={typeof value === 'boolean' ? value.toString() : (value ?? '')}
        onChange={(e: any) => {
          const inputValue = e.target.value;
          if (kind === 'bool') {
            // Accept "true" or "false" (case-insensitive); otherwise fall back to original value
            if (inputValue.toLowerCase() === 'true' || inputValue === '1') {
              handleChange(true);
              return;
            }
            if (inputValue.toLowerCase() === 'false' || inputValue === '0') {
              handleChange(false);
              return;
            }
            // If not "true"/"false", just return the string so user sees what they typed
            handleChange(inputValue);
            return;
          }
          handleChange(inputValue);
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
