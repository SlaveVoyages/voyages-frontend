import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  LinkedEntitySelectionChange,
  isMaterializedEntity,
  MaterializedEntity,
  EntityLinkEditMode,
  LinkedEntityProperty,
  getSchema,
} from '@slavevoyages/voyages-contribute';
import { Alert, Select, Spin, Tooltip } from 'antd';

import { useSchemaEnumeration } from '@/hooks/useEnumeration';
import { useTreeSelectContributeLocation } from '@/hooks/useTreeSelectContributeLocation';

import TreeSelectedEntity from './commonContribute/TreeSelectedEntity';
import { lowerCaseFirstLetter } from './DirectEntityPropertyField';
import { EntityFormProps } from './EntityForm';
import { EntityPropertyChangeCommentBox } from './EntityPropertyChangeCommentBox';
import LinkedEntityAddNewDialogComponent from './LinkedEntityAddNewDialogComponent';
import { LinkedEntityOwnedPropertyComponent } from './LinkedEntityOwnedPropertyComponent';

import '@/style/contributeContent.scss';

export interface LinkedEntityPropertyComponentProps {
  property: LinkedEntityProperty;
  entity: MaterializedEntity;
  lastChange?: LinkedEntitySelectionChange;
  onChange: EntityFormProps['onChange'];
}

export const LinkedEntityPropertyComponent = (
  props: LinkedEntityPropertyComponentProps & EntityFormProps,
) => {
  const { property, entity, lastChange, onChange, readOnly = false } = props;
  const [comments, setComments] = useState<string | undefined>();
  const { uid, mode, label, linkedEntitySchema } = property;
  const value = lastChange
    ? lastChange.changed
    : (entity.data[label] as MaterializedEntity | null);
  if (value && !isMaterializedEntity(value)) {
    return <span>BUG: Expected an entity reference value!</span>;
  }
  if (mode === EntityLinkEditMode.View) {
    return <span>{value?.entityRef.id ?? 'null'}</span>;
  }
  if (mode === EntityLinkEditMode.Own) {
    return <LinkedEntityOwnedPropertyComponent {...props} />;
  }
  const linkedSchema = getSchema(linkedEntitySchema);
  const { items: optionItems } = useSchemaEnumeration(linkedEntitySchema);

  const { locationsList, loading, error } = useTreeSelectContributeLocation({
    expirationSeconds: 300,
  });

  const options = useMemo(() => {
    const res = optionItems.map((entity) => ({
      label: linkedSchema.getLabel(entity.data, true),
      value: entity.entityRef.id,
      entity,
    }));

    if (lastChange?.changed?.entityRef.type === 'new') {
      res.push({
        label: linkedSchema.getLabel(lastChange.changed.data, true),
        value: lastChange.changed.entityRef.id,
        entity: lastChange.changed,
      });
    }
    return res;
  }, [optionItems, lastChange?.changed]);

  const handleChange = useCallback(
    (item: string | number | null) => {
      if (item == null) return;

      const currentId = (lastChange?.changed ?? value)?.entityRef.id ?? null;
      if (item === currentId && comments === lastChange?.comments) {
        return;
      }
      const matchedOption = options.find(
        (x) => String(x.value) === String(item),
      );
      if (!matchedOption) {
        console.warn('No matching option found for item:', item);
        return;
      }

      onChange({
        type: 'update',
        entityRef: entity.entityRef,
        changes: [
          {
            kind: 'linked',
            property: uid,
            comments,
            changed: {
              entityRef: {
                id: item,
                schema: linkedEntitySchema,
                type: 'existing',
              },
              data: matchedOption.entity.data,
              state: 'lazy',
            },
          },
        ],
      });
    },
    [
      onChange,
      entity,
      property,
      comments,
      lastChange,
      value,
      options,
      uid,
      linkedEntitySchema,
    ],
  );

  // Persist a comment on its own. handleChange is gated on a non-null selection
  // and a matching loaded option, so on an empty select (most Itinerary and
  // Outcome fields) or one whose current value is not in the loaded option list,
  // a comment would be dropped -- the uneven-bubbles bug (DD-0545). Recording it
  // directly against the current value (kept as-is, or null when empty) makes
  // the bubble work everywhere, like it does on the direct text/number fields.
  // A plain function (not a hook) so it adds no hook after the early returns
  // above; a stable reference is not needed for the comment box.
  const handleCommentChange = (comment: string) => {
    setComments(comment);
    onChange({
      type: 'update',
      entityRef: entity.entityRef,
      changes: [
        {
          kind: 'linked',
          property: uid,
          comments: comment,
          changed: lastChange?.changed ?? value ?? null,
        },
      ],
    });
  };

  // useEffect only if external `value` updates should trigger a change
  useEffect(() => {
    handleChange(value?.entityRef.id ?? null);
  }, [handleChange, value]);

  const styledOptions = options.map((opt) => ({
    ...opt,
    label: (
      <Tooltip title={opt.label}>
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '400px', // adjust as needed
          }}
        >
          {opt.label}
        </div>
      </Tooltip>
    ),
  }));

  let displaySelected;

  if (property.linkedEntitySchema === 'Location') {
    if (loading) {
      return (
        <Spin spinning={true} tip="Loading location tree...">
          <div style={{ minHeight: 60 }} />
        </Spin>
      );
    }

    if (error) {
      return <Alert type="error" message="Failed to load location data." />;
    }

    displaySelected = (
      <TreeSelectedEntity
        handleChange={handleChange}
        value={value}
        label={label}
        options={options}
        lastChange={lastChange}
        locationsList={locationsList}
        disabled={readOnly}
      />
    );
  } else {
    displaySelected = (
      <Select
        className={`truncate-select ${lastChange ? 'changedEntityProperty' : ''}`}
        value={value?.entityRef.id}
        placeholder={`Select ${lowerCaseFirstLetter(label)}`}
        style={{ width: 'calc(100% - 20px)' }}
        options={styledOptions}
        onChange={handleChange}
        showSearch
        styles={{
          popup: { root: { maxHeight: 400, overflow: 'auto', zIndex: 9999 } },
        }}
        optionLabelProp="label"
        filterOption={(input: string, option: any) =>
          (option?.label?.props?.title ?? '')
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        disabled={readOnly}
      />
    );
  }

  return (
    <>
      {displaySelected}
      {mode === EntityLinkEditMode.Create && (
        <LinkedEntityAddNewDialogComponent {...props} comments={comments} />
      )}
      <EntityPropertyChangeCommentBox
        property={property}
        current={lastChange?.comments}
        onComment={handleCommentChange}
      />
    </>
  );
};
