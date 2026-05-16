import React, { ReactNode, useMemo, useEffect } from 'react';

import {
  EntityChange,
  EntitySchema,
  MaterializedEntity,
  PropertyAccessLevel,
} from '@slavevoyages/voyages-contribute';
import { CollapseProps, Form, Typography } from 'antd';

import { StyledCollapse } from '@/styleMUI/stylesMenu/styleCollapse';

import { EntityPropertyComponent } from './EntityPropertyComponent';

export interface ContributionFormProps {
  entity: MaterializedEntity;
}

export interface EntityFormProps {
  schema: EntitySchema;
  entity: MaterializedEntity;
  changes: EntityChange[];
  onChange: (change: EntityChange) => void;
  /*
    entity: MaterializedEntity
    changeSet: ChangeSet
    onUpdate: (changeSet: ChangeSet) => void
    */
  expandedMenu: string[];
  setExpandedMenu: React.Dispatch<React.SetStateAction<string[]>>;
  accessLevel: PropertyAccessLevel;
  onSectionsChange?: (sections: CollapseProps['items']) => void;
  readOnly?: boolean;
}

// Section labels that differ from what the voyages-contribute package ships.
// Keyed by the package's section string, valued by what the UI should display.
const SECTION_LABEL_OVERRIDES: Record<string, string> = {
  'Slave numbers': 'Enslaved',
};

export const EntityForm = ({
  schema,
  entity,
  changes,
  onChange,
  expandedMenu,
  setExpandedMenu,
  accessLevel,
  onSectionsChange,
  readOnly = false,
}: EntityFormProps) => {
  const properties = useMemo(
    () =>
      schema.properties.filter(
        (p) => p.accessLevel === undefined || p.accessLevel <= accessLevel,
      ),
    [schema, accessLevel],
  );

  const children = useMemo(
    () =>
      properties.map((p) => {
        const component = (
          <>
            <EntityPropertyComponent
              key={p.uid}
              schema={schema}
              expandedMenu={expandedMenu}
              setExpandedMenu={setExpandedMenu}
              entity={entity}
              property={p}
              changes={changes}
              onChange={onChange}
              accessLevel={accessLevel}
              readOnly={readOnly}
            />
          </>
        );

        return p.kind === 'bool' ||
          p.kind === 'text' ||
          p.kind === 'number' ||
          p.kind === 'linkedEntity'
          ? addLabel(component, p.label, p.schema)
          : component;
      }),
    [
      properties,
      schema,
      expandedMenu,
      setExpandedMenu,
      entity,
      changes,
      onChange,
      accessLevel,
      readOnly,
    ],
  );

  // Group by sections (if any).
  const [ungrouped, sections] = useMemo(() => {
    const map: Record<string, ReactNode[]> = {};
    for (let i = 0; i < properties.length; ++i) {
      (map[properties[i].section ?? ''] ??= []).push(children[i]!);
    }
    const collapsible: CollapseProps['items'] = [];
    for (const [section, items] of Object.entries(map)) {
      if (section !== '') {
        const displaySection = SECTION_LABEL_OVERRIDES[section] ?? section;
        collapsible.push({
          key: `${items.map((item) => {
            if (React.isValidElement(item)) {
              return item.props.children.key;
            } else {
              return item?.toString();
            }
          })}`,
          label: (
            <Typography.Title level={4} className="collapse-title">
              {displaySection}
            </Typography.Title>
          ),
          children: (
            <div>
              {items.map((item, index) => (
                <div key={`${section}-${index}`}>{item}</div>
              ))}
            </div>
          ),
        });
      }
    }

    return [map[''] ?? [], collapsible];
  }, [properties, children]);

  useEffect(() => {
    onSectionsChange?.(sections);
  }, [sections, onSectionsChange]);
  return (
    <>
      {ungrouped.length > 0 &&
        ungrouped.map((item, index) => (
          <div key={`ungrouped-${index}`}>{item}</div>
        ))}
      {sections.length > 0 && (
        <StyledCollapse
          activeKey={expandedMenu}
          onChange={(keys) => {
            setExpandedMenu(keys as string[]);
          }}
          bordered={false}
          items={sections}
          ghost
          className="custom-collapse"
        />
      )}
    </>
  );
};

const addLabel = (item: ReactNode, label: string, schema: string) => {
  const isVoyageSparseDate = schema === 'VoyageSparseDate';
  if (isVoyageSparseDate) {
    // For date fields, use a more compact layout with better alignment
    return (
      <Form.Item
        label={<span className="form-contribute-label">{label}</span>}
        name={label}
        style={{
          margin: '8px 0px',
          marginBottom: '12px',
        }}
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {item}
        </div>
      </Form.Item>
    );
  }

  // For regular fields
  return (
    <Form.Item
      label={<span className="form-contribute-label">{label}</span>}
      name={label}
      style={{ margin: '2px 0 4px 0' }}
    >
      {item}
    </Form.Item>
  );
};
