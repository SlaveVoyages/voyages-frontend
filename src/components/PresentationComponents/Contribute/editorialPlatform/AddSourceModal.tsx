import { useEffect, useState } from 'react';

import { Alert, Button, Form, Input, message, Modal, Select } from 'antd';

import {
  fetchSourceTypes,
  SourceType,
} from '@/fetch/contributeFetch/fetchSourcesData';

const { TextArea } = Input;

export interface AddSourceValues {
  shortRef: string;
  fullRef: string;
  sourceTypeId: number;
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
}

// In-app Add Source form matching the legacy Voyage Admin "Add Source" screen:
// Short ref / Full ref / Source type. Built in the new app rather than linking
// out to Django admin. Saving is disabled until a create endpoint exists in
// voyages-api (see onSubmit note above).
const AddSourceModal: React.FC<AddSourceModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<AddSourceValues>();
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const saveEnabled = typeof onSubmit === 'function';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingTypes(true);
    fetchSourceTypes()
      .then((types) => {
        if (!cancelled) setSourceTypes(types);
      })
      .catch((error) => {
        if (cancelled) return;
        message.error('Failed to load source types');
        console.error('Source types load error:', error);
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

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

        <Form.Item
          name="sourceTypeId"
          label="Source type"
          rules={[{ required: true, message: 'Source type is required' }]}
        >
          <Select
            loading={loadingTypes}
            placeholder="Select a source type"
            options={sourceTypes.map((t) => ({ value: t.id, label: t.name }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddSourceModal;
