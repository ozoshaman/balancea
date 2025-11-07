// src/components/common/Modal.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  //Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#300152',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(48, 1, 82, 0.1)',
          }}
        >
          <Typography variant="h6" component="span">
            {title}
          </Typography>
          {onClose && (
            <IconButton
              onClick={onClose}
              sx={{
                color: '#300152',
                '&:hover': {
                  backgroundColor: 'rgba(48, 1, 82, 0.1)',
                },
              }}
            >
              <Close />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent sx={{ mt: 2, color: '#300152' }}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            padding: 2,
            borderTop: '1px solid rgba(48, 1, 82, 0.1)',
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;