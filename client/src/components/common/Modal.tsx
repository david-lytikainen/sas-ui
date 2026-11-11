import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: (event?: unknown, reason?: string) => void;
  children: ReactNode;
  size?: string;
}

const Modal = ({ open, onClose, children, size = '' }: ModalProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const modal = ref.current;
    if (!open || !modal) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const title = modal.querySelector('.modal-header');
    if (title) title.id = titleId;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(event, 'escapeKeyDown'); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, [open, titleId]);
  if (!open) return null;
  return createPortal(
    <>
      <div ref={ref} className="modal fade show d-block" role="dialog" tabIndex={-1} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(event, 'backdropClick'); }}>
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size ? `modal-${size}` : ''}`}>
          <div className="modal-content">{children}</div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body,
  );
};

export default Modal;
