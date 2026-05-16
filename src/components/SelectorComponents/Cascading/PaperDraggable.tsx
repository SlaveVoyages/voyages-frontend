import { useRef } from 'react';

import { Paper } from '@mui/material';
import { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import '@/style/dialog.scss';

import { PaperDraggableTimeLapseStyle } from '@/styleMUI';

export function PaperDraggable(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-dialog" />
    </Draggable>
  );
}

export function PaperDraggableTimeLapse(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title-timelapse"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        style={{ ...PaperDraggableTimeLapseStyle }}
      />
    </Draggable>
  );
}

export function PaperDraggableLinkEntityAddComponent(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title-contribute"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-dialog" />
    </Draggable>
  );
}

export function PaperDraggableNumbersTable(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-nubmer"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className="paper-draggable-md-dialog"
      />
    </Draggable>
  );
}

export function PaperDraggableDeleteBatch(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-delete-batch"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-dialog" />
    </Draggable>
  );
}

export function PaperDraggableEditBatch(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-edit-batch"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-dialog" />
    </Draggable>
  );
}

export function PaperDraggableLinkEntityPreviewChange(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-title-preview"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-md-dialog" />
    </Draggable>
  );
}

export function PaperDraggableCreateBatch(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-create-batch"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-dialog" />
    </Draggable>
  );
}

export function PaperDraggableBatchManagement(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-batch-management"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper
        {...props}
        ref={paperRef}
        className="paper-draggable-md-dialog"
      />
    </Draggable>
  );
}

export function PaperDraggableBatchAssignmentModal(props: PaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      handle="#draggable-dialog-batch-assignment"
      cancel={'[class*="MuiDialogContent-root"]'}
      nodeRef={paperRef}
    >
      <Paper {...props} ref={paperRef} className="paper-draggable-dialog" />
    </Draggable>
  );
}
