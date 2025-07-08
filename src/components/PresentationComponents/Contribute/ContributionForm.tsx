import {
  Button,
  CollapseProps,
  Form,
  Row,
  Col,
  Input,
  Select,
  Card,
  Modal,
  Typography,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  addToChangeSet,
  combineChanges,
  dropOrphans,
  EntityChange,
  ChangeSet,
  getSchema,
  applyChanges,
  cloneEntity,
  expandMaterialized,
  MaterializedEntity,
  PropertyChange,
  PropertyAccessLevel,
} from '@dotproductdev/voyages-contribute';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { translationLanguagesContribute } from '@/utils/functions/translationLanguages';
import { EntityForm } from './EntityForm';
import ChangesSummary from './ChangesSummary';

const { Text } = Typography;
const [contributeForm] = Form.useForm();

export const ContributionForm = ({ entity }: { entity: MaterializedEntity }) => {
  const schema = getSchema(entity.entityRef.schema);
  const [changeSet, setChangeSet] = useState<ChangeSet>({
    id: -1,
    author: 'Mocked',
    title: '',
    changes: [],
    comments: '',
    timestamp: new Date().getTime(),
  });
  const [accessLevel, setAccessLevel] = useState<PropertyAccessLevel>(
    PropertyAccessLevel.AdvancedContributor,
  );
  const [globalExpand, setGlobalExpand] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string[]>([]);
  const [sections, setSections] = useState<CollapseProps['items']>([]);
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages
  );
  const translatedcontribute = translationLanguagesContribute(languageValue);

  const accessLevelOptions = Object.entries(PropertyAccessLevel)
    .filter(([key]) => isNaN(Number(key)) && key !== 'Hidden')
    .map(([label, value]) => ({ label: label.replace(/([A-Z])/g, ' $1').trim(), value }));

  useEffect(() => {
    contributeForm.setFieldsValue({
      title: changeSet.title,
      comments: changeSet.comments,
      accessLevel: PropertyAccessLevel.AdvancedContributor,
    });
    setChangeSet({
      id: -1,
      author: 'Mocked',
      title: `Contribution for ${schema.getLabel(entity.data)}`,
      changes: [],
      comments: '',
      timestamp: new Date().getTime(),
    });
  }, [schema, entity]);

  function combineOwnedChanges(changes: PropertyChange[]): PropertyChange[] {
    const seen: Record<string, PropertyChange> = {};

    changes.forEach(change => {
      seen[change.property] = change;
    });

    return Object.values(seen);
  }

  function combineEntityChanges(changes: EntityChange[]): EntityChange[] {
    return changes.map(change => {
      if (change.type === 'update') {
        return {
          ...change,
          changes: change.changes.map(propertyChange => {
            if (propertyChange.kind === 'owned') {
              return {
                ...propertyChange,
                changes: combineOwnedChanges(propertyChange.changes),
              };
            }
            return propertyChange;
          }),
        };
      }
      return change;
    });
  }

  const onChangesUpdate = useCallback(
    (newChange: EntityChange) =>
      setChangeSet((current) => {
        const next = addToChangeSet(current.changes, newChange);
        dropOrphans(next);
        const combined = combineEntityChanges(next);
        return { ...current, changes: combined };
      }),
    [],
  );

  const handlePreviewChanges = () => {
    const formValues = contributeForm.getFieldsValue();
    console.log('Form Values:', formValues);
    console.log('ChangeSet:', changeSet);
    const combined = combineChanges(changeSet.changes);
    console.log('Flattened change set:', combined);

    const updated = cloneEntity(entity);
    applyChanges(expandMaterialized(updated), changeSet.changes);
    console.log('Entity after applying changes:', updated);
  };

  const submitChanges = async () => {
    try {
      const formValues = await contributeForm.validateFields();

      const payload = {
        title: formValues.title,
        comments: formValues.comments,
        accessLevel: formValues.accessLevel,
        timestamp: Date.now(),
        changes: changeSet.changes,
      };

      console.log('Submit Payload:', payload);

      alert('Changes submitted successfully!');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const resetAllChanges = () => {
    Modal.confirm({
      title: 'Reset all changes?',
      content: 'This will clear all unsaved edits. Are you sure?',
      onOk: () => {
        setChangeSet((current) => ({ ...current, changes: [] }));
        contributeForm.resetFields();
      },
    });
  };

  const handleSaveChanges = () => {
    console.log('Saving changes:', changeSet);
  };

  const toggleExpandAll = () => {
    const allKeys = sections?.map((section) => section.key as string) ?? [];
    setExpandedMenu(globalExpand ? [] : allKeys);
    setGlobalExpand(!globalExpand);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
      <Card
        title="Contribution Details"
        style={{ flexShrink: 0 }}
        styles={{
          body: {
            paddingTop: 12,
            paddingBottom: 0,
          }
        }}
      >
        <Form form={contributeForm} layout="vertical" onFinish={submitChanges}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Contribution Title" name="title">
                <Input />
              </Form.Item>
              <Form.Item label="Contribution Message" name="comments">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contributor Mode" name="accessLevel">
                <Select options={accessLevelOptions} style={{ width: '100%' }} />
              </Form.Item>
              <Row style={{ display: 'flex', justifyContent: 'center' }}>
                <Form.Item label=" " colon={false} style={{ width: 200 }}>
                  <Button danger block onClick={handlePreviewChanges}>
                    Preview Changes
                  </Button>
                </Form.Item>
              </Row>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: '12px', padding: '12px 0' }}>
        {/* Left Panel */}
        <Col span={12} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            styles={{
              body: {
                padding: 0,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }
            }}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 99,
              background: '#fff',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
            }}>
              <Text strong>{translatedcontribute.titleCollaps}</Text>
              <a onClick={toggleExpandAll} style={{ marginLeft: 12 }}>
                {globalExpand ? translatedcontribute.collapse : translatedcontribute.expand}
              </a>
            </div>
            <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
              <EntityForm
                key={entity.entityRef.id}
                schema={schema}
                entity={entity}
                changes={changeSet.changes}
                onChange={onChangesUpdate}
                setExpandedMenu={setExpandedMenu}
                expandedMenu={expandedMenu}
                accessLevel={accessLevel}
                onSectionsChange={setSections}
              />
            </div>
          </Card>
        </Col>

        {/* Right Panel */}
        <Col span={12} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            styles={{
              body: {
                padding: 0,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }
            }}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 99,
              background: '#fff',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <Text strong>Changes Summary</Text>
              <Text type="secondary">
                {changeSet.changes.length} change{changeSet.changes.length !== 1 && 's'}
              </Text>
            </div>
            <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
              <ChangesSummary
                changes={changeSet.changes}
                resetAllChanges={resetAllChanges}
                submitChanges={submitChanges}
                handleSaveChanges={handleSaveChanges}
                entity={entity}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
