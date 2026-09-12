import { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tooltip,
} from 'antd';

const { TextArea } = Input;

// Controlled source-type vocabulary, matching the legacy Voyage Admin "Add
// Source" dropdown exactly (same order, same labels).
export const SOURCE_TYPE_NAMES = [
  'Documentary source',
  'Newspaper',
  'Published source',
  'Unpublished secondary source',
  'Private note or collection',
];

export interface AddSourceValues {
  shortRef: string;
  fullRef: string;
  sourceType: string;
}

export interface AddSourceTypeValues {
  groupId?: number;
  groupName: string;
}

interface AddSourceModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called with the entered values on Save. Optional and currently unwired:
   * voyages-api has no create-source endpoint yet (the CRUD views are
   * commented out), so until that backend endpoint exists — a change that
   * needs Domingos — there is nowhere to send this. When it lands, pass a
   * handler that POSTs to it and the form is ready.
   */
  onSubmit?: (values: AddSourceValues) => Promise<void> | void;
  /**
   * Called when a new source type is added via the "+" form. Also unwired
   * until voyages-api exposes a create-source-type endpoint.
   */
  onAddSourceType?: (values: AddSourceTypeValues) => Promise<void> | void;
}

// ── Nested "Add Source type" form (the legacy "+" popup) ─────────────────────
// Mirrors the legacy Voyage Admin "Add Sources type" popup: Group id / Group
// name. Opened from the "+" beside the Source type dropdown.
const AddSourceTypeModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: AddSourceTypeValues) => Promise<void> | void;
}> = ({ open, onClose, onSubmit }) => {
  const [form] = Form.useForm<AddSourceTypeValues>();
  const [submitting, setSubmitting] = useState(false);
  const saveEnabled = typeof onSubmit === 'function';

  const handleOk = async () => {
    if (!saveEnabled) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit?.(values);
      message.success('Source type added');
      form.resetFields();
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      message.error('Failed to add source type');
      console.error('Add source type error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add Sources type"
      open={open}
      onCancel={handleCancel}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={submitting}
          disabled={!saveEnabled}
          onClick={handleOk}
        >
          Save
        </Button>,
      ]}
    >
      {!saveEnabled && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Saving is not available yet"
          description="Adding a source type needs a create endpoint in voyages-api, which does not exist yet (backend change — Domingos)."
        />
      )}
      <Form form={form} layout="vertical" requiredMark>
        <Form.Item name="groupId" label="Group id">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="groupName"
          label="Group name"
          rules={[{ required: true, message: 'Group name is required' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// In-app Add Source form matching the legacy Voyage Admin "Add Source" screen:
// Short ref / Full ref / Source type. Built in the new app rather than linking
// out to Django admin. Saving is disabled until a create endpoint exists in
// voyages-api (see onSubmit note above).
const AddSourceModal: React.FC<AddSourceModalProps> = ({
  open,
  onClose,
  onSubmit,
  onAddSourceType,
}) => {
  const [form] = Form.useForm<AddSourceValues>();
  const [submitting, setSubmitting] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);

  const saveEnabled = typeof onSubmit === 'function';

  const handleOk = async () => {
    if (!saveEnabled) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit?.(values);
      message.success('Source added');
      form.resetFields();
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return; // validation
      message.error('Failed to add source');
      console.error('Add source error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add Source"
      open={open}
      onCancel={handleCancel}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={submitting}
          disabled={!saveEnabled}
          onClick={handleOk}
        >
          Save
        </Button>,
      ]}
    >
      {!saveEnabled && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Saving is not available yet"
          description="Creating a source needs a create endpoint in voyages-api, which does not exist yet. The form is ready; saving will work once that endpoint is added (backend change — Domingos)."
        />
      )}

      <Form form={form} layout="vertical" requiredMark>
        <Form.Item
          name="shortRef"
          label="Short ref"
          rules={[{ required: true, message: 'Short ref is required' }]}
        >
          <TextArea rows={2} placeholder="e.g. TSTD2" />
        </Form.Item>

        <Form.Item
          name="fullRef"
          label="Full ref"
          rules={[{ required: true, message: 'Full ref is required' }]}
        >
          <TextArea rows={5} placeholder="Full bibliographic reference" />
        </Form.Item>

        <Form.Item label="Source type" required>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              name="sourceType"
              noStyle
              rules={[{ required: true, message: 'Source type is required' }]}
            >
              <Select
                placeholder="---------"
                style={{ width: '100%' }}
                options={SOURCE_TYPE_NAMES.map((name) => ({
                  value: name,
                  label: name,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Tooltip title="Add source type">
              <Button
                icon={<PlusOutlined />}
                onClick={() => setTypeModalOpen(true)}
              />
            </Tooltip>
          </Space.Compact>
        </Form.Item>
      </Form>

      <AddSourceTypeModal
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        onSubmit={onAddSourceType}
      />
    </Modal>
  );
};

export default AddSourceModal;
