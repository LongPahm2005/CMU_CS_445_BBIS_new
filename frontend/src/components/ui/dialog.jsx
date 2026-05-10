export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        {children}
        <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" onClick={() => onOpenChange(false)}>X</button>
      </div>
    </div>
  );
}
export function DialogTrigger({ children }) { return <span>{children}</span>; }
export function DialogContent({ children, className }) { return <div className={`modal-content ${className || ""}`}>{children}</div>; }
export function DialogHeader({ children }) { return <div className="modal-header">{children}</div>; }
export function DialogTitle({ children }) { return <h5 className="modal-title">{children}</h5>; }
