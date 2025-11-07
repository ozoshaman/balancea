// src/components/common/TermsCheckbox.jsx
import { FormControlLabel, Checkbox, Typography, Link as MuiLink } from '@mui/material';

const TermsCheckbox = ({ 
  name = 'acceptTerms',
  checked, 
  onChange, 
  error,
  onTermsClick 
}) => {
  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            name={name}
            checked={checked}
            onChange={onChange}
            sx={{
              color: '#300152',
              '&.Mui-checked': {
                color: '#300152',
              },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: '#300152' }}>
            Acepto los{' '}
            <MuiLink
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                onTermsClick();
              }}
              sx={{ 
                cursor: 'pointer',
                color: '#7218a8',
                fontWeight: 600,
                textDecoration: 'underline',
                '&:hover': {
                  color: '#300152',
                },
              }}
            >
              términos y condiciones
            </MuiLink>
          </Typography>
        }
      />
      {/* Reserve a small area for the error message so showing/hiding it doesn't shift layout */}
      <Typography
        variant="caption"
        color={error ? 'error' : 'text.secondary'}
        display="block"
        sx={{ ml: 4, minHeight: '1rem' }}
      >
        {error || '\u00A0'}
      </Typography>
    </>
  );
};

export default TermsCheckbox;