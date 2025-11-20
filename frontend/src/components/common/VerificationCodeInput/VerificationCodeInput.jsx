// src/components/common/VerificationCodeInput/VerificationCodeInput.jsx
import { useRef, useState, useEffect } from 'react';
import { Box, TextField } from '@mui/material';

const VerificationCodeInput = ({ value, onChange, disabled = false }) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Inicializar refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Sincronizar con el valor externo
  useEffect(() => {
    if (value && value.length <= 6) {
      const newDigits = value.split('');
      while (newDigits.length < 6) {
        newDigits.push('');
      }
      setDigits(newDigits);
    } else if (!value) {
      setDigits(['', '', '', '', '', '']);
    }
  }, [value]);

  const handleChange = (index, newValue) => {
    // Solo permitir números
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = newValue;
    setDigits(newDigits);

    // Llamar al onChange con el código completo
    const code = newDigits.join('');
    onChange(code);

    // Mover al siguiente input si hay un valor
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Retroceso: limpiar campo actual y volver al anterior
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      
      if (digits[index]) {
        // Si hay un dígito, borrarlo
        newDigits[index] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
      } else if (index > 0) {
        // Si está vacío, ir al anterior y borrarlo
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Flecha izquierda
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Flecha derecha
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Solo procesar si son exactamente 6 dígitos
    if (/^\d{6}$/.test(pastedData)) {
      const newDigits = pastedData.split('');
      setDigits(newDigits);
      onChange(pastedData);
      // Enfocar el último input
      inputRefs.current[5]?.focus();
    }
  };

  const handleFocus = (index) => {
    // Seleccionar el contenido al enfocar
    inputRefs.current[index]?.select();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {digits.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          variant="outlined"
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              padding: '12px',
            },
          }}
          sx={{
            width: '50px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: '#300152',
                borderWidth: '2px',
              },
              '&:hover fieldset': {
                borderColor: '#4a0182',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#300152',
                borderWidth: '3px',
              },
              '&.Mui-disabled': {
                backgroundColor: '#f5f5f5',
              },
            },
            '& input': {
              color: '#300152',
            },
          }}
        />
      ))}
    </Box>
  );
};

export default VerificationCodeInput;