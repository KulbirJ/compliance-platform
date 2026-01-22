import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const Modal = ({ open, onClose, title, children, actions }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};

export default Modal;
