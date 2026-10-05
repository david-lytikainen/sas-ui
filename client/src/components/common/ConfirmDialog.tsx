import Modal from './Modal';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
}: ConfirmDialogProps) => (
  <Modal onClose={onCancel} size="" open={open}>
    <div className="modal-header fw-semibold">{title}</div>
    <div className="modal-body">
      <div>{children}</div>
    </div>
    <div className="modal-footer">
      <button type="button" onClick={onCancel} className="btn btn-link"> {cancelLabel} </button>
      <button type="button" onClick={onConfirm} className={`btn btn-${confirmColor === 'error' ? 'danger' : confirmColor}`}> {confirmLabel} </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
