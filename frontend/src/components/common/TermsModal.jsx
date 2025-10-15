// src/components/common/TermsModal.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

const TermsModal = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Términos y Condiciones de Uso
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            1. Aceptación de Términos
          </Typography>
          <Typography variant="body2" paragraph>
            Al registrarte en Balancea, aceptas cumplir con estos términos y condiciones.
            Si no estás de acuerdo con alguna parte de estos términos, no debes usar
            nuestra aplicación.
          </Typography>

          <Typography variant="h6" gutterBottom>
            2. Descripción del Servicio
          </Typography>
          <Typography variant="body2" paragraph>
            Balancea es una aplicación web progresiva (PWA) diseñada para ayudarte a
            gestionar tus finanzas personales de manera simple e intuitiva. Permite
            registrar ingresos, gastos, categorías y presupuestos.
          </Typography>

          <Typography variant="h6" gutterBottom>
            3. Privacidad y Protección de Datos
          </Typography>
          <Typography variant="body2" paragraph>
            Nos comprometemos a proteger tu información personal. Tus datos financieros
            son privados y no serán compartidos con terceros sin tu consentimiento explícito.
            Toda la información está protegida mediante encriptación y medidas de seguridad
            estándar de la industria.
          </Typography>

          <Typography variant="h6" gutterBottom>
            4. Uso de la Cuenta
          </Typography>
          <Typography variant="body2" paragraph>
            Eres responsable de mantener la confidencialidad de tu contraseña y cuenta.
            Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.
          </Typography>

          <Typography variant="h6" gutterBottom>
            5. Limitación de Responsabilidad
          </Typography>
          <Typography variant="body2" paragraph>
            Balancea se proporciona "tal cual" sin garantías de ningún tipo. No somos
            responsables de decisiones financieras tomadas en base a la información
            proporcionada por la aplicación.
          </Typography>

          <Typography variant="h6" gutterBottom>
            6. Modificaciones del Servicio
          </Typography>
          <Typography variant="body2" paragraph>
            Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier
            momento, con o sin previo aviso.
          </Typography>

          <Typography variant="body2" sx={{ mt: 3, fontStyle: 'italic' }}>
            Última actualización: Octubre 2025
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsModal;