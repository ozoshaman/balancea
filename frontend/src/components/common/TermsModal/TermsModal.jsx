// src/components/common/TermsModal.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import Button from '../Button/Button.jsx';

const TermsModal = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#300152',
          fontWeight: 'bold',
          borderBottom: '2px solid #7218a8',
          pb: 2,
        }}
      >
        <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
          Términos y Condiciones
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#300152',
            '&:hover': {
              backgroundColor: 'rgba(114, 24, 168, 0.1)',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, color: '#300152' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" paragraph>
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3, backgroundColor: 'rgba(114, 24, 168, 0.2)' }} />

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold' }}>
          1. Aceptación de los Términos
        </Typography>
        <Typography variant="body2" paragraph>
          Al acceder y utilizar Balancea, usted acepta cumplir con estos términos y condiciones.
          Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra
          aplicación.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold', mt: 3 }}>
          2. Uso de la Aplicación
        </Typography>
        <Typography variant="body2" paragraph>
          Balancea es una plataforma de gestión financiera personal. Usted se compromete a:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body2" paragraph>
            Proporcionar información precisa y actualizada durante el registro
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            Mantener la confidencialidad de su contraseña
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            No utilizar la aplicación para fines ilegales o no autorizados
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            No intentar acceder a cuentas de otros usuarios
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold', mt: 3 }}>
          3. Privacidad y Protección de Datos
        </Typography>
        <Typography variant="body2" paragraph>
          Nos comprometemos a proteger su información personal. Todos los datos financieros son
          encriptados y almacenados de forma segura. No compartiremos su información con terceros
          sin su consentimiento explícito.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold', mt: 3 }}>
          4. Responsabilidades del Usuario
        </Typography>
        <Typography variant="body2" paragraph>
          Usted es responsable de:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body2" paragraph>
            La exactitud de los datos ingresados en la aplicación
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            Las decisiones financieras tomadas basándose en la información de la aplicación
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            Mantener actualizada su información de contacto
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold', mt: 3 }}>
          5. Limitación de Responsabilidad
        </Typography>
        <Typography variant="body2" paragraph>
          Balancea proporciona herramientas de gestión financiera, pero no ofrece asesoramiento
          financiero profesional. No nos hacemos responsables de pérdidas financieras derivadas
          del uso de la aplicación.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold', mt: 3 }}>
          6. Modificaciones del Servicio
        </Typography>
        <Typography variant="body2" paragraph>
          Nos reservamos el derecho de modificar o descontinuar la aplicación en cualquier
          momento, con o sin previo aviso.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold', mt: 3 }}>
          7. Terminación de Cuenta
        </Typography>
        <Typography variant="body2" paragraph>
          Podemos suspender o terminar su cuenta si detectamos violaciones a estos términos.
          Usted puede cancelar su cuenta en cualquier momento desde la configuración de su perfil.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ color: '#7218a8', fontWeight: 'bold', mt: 3 }}>
          8. Contacto
        </Typography>
        <Typography variant="body2" paragraph>
          Si tiene preguntas sobre estos términos, puede contactarnos a través de:
        </Typography>
        <Typography variant="body2" paragraph sx={{ pl: 2 }}>
          Email: soporte@balancea.com
        </Typography>

        <Divider sx={{ my: 3, backgroundColor: 'rgba(114, 24, 168, 0.2)' }} />

        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#7218a8' }}>
          Al hacer clic en "Acepto los términos y condiciones", usted confirma que ha leído,
          entendido y acepta estar sujeto a estos términos.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          padding: 3,
          borderTop: '2px solid #7218a8',
          justifyContent: 'center',
        }}
      >
        <Button onClick={onClose} sx={{ minWidth: 200 }}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsModal;