import { ReactNode, useEffect, useId, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: (event?: unknown, reason?: string) => void;
  children: ReactNode;
  size?: string;
}

const Modal = ({ open, onClose, children, size = '' }: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const title = dialog.querySelector('.modal-header');
    if (title) title.id = titleId;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, [open, titleId]);
  return (
    <dialog ref={ref} className={`sas-modal rounded p-0 border-0 bg-transparent text-body ${size ? `modal-${size}` : ''}`} aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); onClose(e, 'escapeKeyDown'); }} onClick={(e) => { const bounds = e.currentTarget.getBoundingClientRect(); if (e.target === e.currentTarget && (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom)) onClose(e, 'backdropClick'); }} >
      {open && <div className="modal-content">{children}</div>}
    </dialog>
  );
};

export default Modal;
