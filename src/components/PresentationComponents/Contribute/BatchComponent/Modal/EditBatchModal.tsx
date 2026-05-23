import React, { useState, useEffect } from 'react';

import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { PublicationBatch } from '@slavevoyages/voyages-contribute';

import { PaperDraggableEditBatch } from '@/components/SelectorComponents/Cascading/PaperDraggable';
import { useBatchManagement } from '@/hooks/useBatchManagement';
import { StyleDialog } from '@/styleMUI';

interface EditBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch: PublicationBatch | null;
}

const EditBatchModal: React.FC<EditBatchModalProps> = ({
  visible,
  onClose,
  onSuccess,
  batch,
}) => {
  const [formData, setFormData] = useState<Partial<PublicationBatch>>({
    title: '',
    comments: '',
  });
  const [errors, setErrors] = useState<Partial<PublicationBatch>>({});

  const { updateBatch, loading } = useBatchManagement();

  // Initialize form data when batch changes
  useEffect(() => {
    if (batch && visible) {
      setFormData({
        title: batch.title || '',
        comments: batch.comments || '',
      });
      setErrors({});
    }
  }, [batch, visible]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PublicationBatch> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Please enter a batch title';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (formData.comments && formData.comments.length > 500) {
      newErrors.comments = 'Comments must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !batch) {
      return;
    }

    const result = await updateBatch(batch.id, formData);
    if (result) {
      handleClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    setFormData({ title: '', comments: '' });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof PublicationBatch, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!batch) {
    return null;
  }

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      disableScrollLock={false}
      sx={{
        ...StyleDialog,
      }}
      fullWidth
      maxWidth="sm"
      PaperComponent={PaperDraggableEditBatch}
      aria-labelledby="draggable-dialog-edit-batch"
    >
      <DialogTitle
        sx={{
          cursor: 'move',
          position: 'relative',
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'rgb(55, 148, 141)',
          color: '#fff',
          py: 2,
        }}
      >
        <Typography variant="h6" component="div">
          Edit Publication Batch
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Batch Title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              required
              slotProps={{ input: { inputProps: { maxLength: 100 } } }}
              size="small"
              label={
                <Typography
                  variant="body1"
                  style={{
                    fontSize: 16,
                    color: '#4e4e4e',
                  }}
                >
                  Batch Title:
                </Typography>
              }
            />

            <TextField
              fullWidth
              label={
                <Typography
                  variant="body1"
                  style={{
                    fontSize: 16,
                    color: '#4e4e4e',
                  }}
                >
                  Comments
                </Typography>
              }
              placeholder="Add any notes or comments about this batch..."
              value={formData.comments || ''}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              error={!!errors.comments}
              helperText={
                errors.comments ||
                `${(formData.comments || '').length}/500 characters`
              }
              multiline
              rows={4}
              slotProps={{ input: { inputProps: { maxLength: 500 } } }}
            />
          </Box>

          {/* Character count display */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Title: {(formData.title || '').length}/100 characters
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Comments: {(formData.comments || '').length}/500 characters
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading}
            style={{ textTransform: 'unset', height: 32 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.title?.trim()}
            sx={{
              textTransform: 'unset',
              height: 32,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0f766e 0%, #047857 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              'Update Batch'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditBatchModal;
