// src/components/common/Alert.jsx
import { Alert as MuiAlert, AlertTitle } from '@mui/material';

const Alert = ({
  severity = 'info',
  title,
  children,
  onClose,
  sx = {},
  ...props
}) => {
  return (
    <MuiAlert
      severity={severity}
      onClose={onClose}
      sx={{
        borderRadius: 2,
        mb: 2,
        '& .MuiAlert-message': {
          color: '#300152',
        },
        ...sx,
      }}
      {...props}
    >
      {title && <AlertTitle sx={{ fontWeight: 'bold' }}>{title}</AlertTitle>}
      {children}
    </MuiAlert>
  );
};

export default Alert;