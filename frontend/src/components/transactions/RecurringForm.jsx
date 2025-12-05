import React from 'react';
import { Stack, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel } from '@mui/material';

const units = [
  { value: 'MINUTES', label: 'Minutos' },
  { value: 'HOURS', label: 'Horas' },
  { value: 'DAYS', label: 'Días' },
  { value: 'WEEKS', label: 'Semanas' },
  { value: 'MONTHS', label: 'Meses' },
  { value: 'YEARS', label: 'Años' },
];

const RecurringForm = ({ value, onChange }) => {
  const v = value || {};

  const handle = (field) => (e) => {
    const val = e?.target?.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange({ ...v, [field]: val });
  };

  // Helpers to split / combine date + time to ISO using the user's local timezone
  const toDateInput = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      // Use locale 'en-CA' to get YYYY-MM-DD format reliably
      return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    } catch (e) {
      return '';
    }
  };

  const toTimeInput = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (e) {
      return '';
    }
  };

  const combineDateTime = (datePart, timePart) => {
    if (!datePart) return null;
    // timePart expected as 'HH:MM' or undefined
    const time = timePart || '00:00';
    // Construct a local datetime string (no Z) so Date() treats it as local
    const localString = `${datePart}T${time}:00`;
    const d = new Date(localString);
    if (Number.isNaN(d.getTime())) return null;
    // Store as ISO UTC string
    return d.toISOString();
  };

  // Prevent manual typing but allow navigation keys (Tab, Arrow keys, Backspace, etc.)
  const preventManualTyping = (e) => {
    // e.key is a single char for printable keys; longer names for control keys
    if (e.key && e.key.length === 1) {
      e.preventDefault();
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Cada"
          type="number"
          value={v.frequencyValue ?? 1}
          onChange={handle('frequencyValue')}
          inputProps={{ min: 1 }}
          sx={{ width: 120 }}
        />

        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Unidad</InputLabel>
          <Select value={v.frequencyUnit || 'DAYS'} label="Unidad" onChange={handle('frequencyUnit')}>
            {units.map(u => (
              <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Fecha inicio"
          type="date"
          value={toDateInput(v.startDate)}
          onChange={(e) => {
            const newIso = combineDateTime(e.target.value, toTimeInput(v.startDate));
            onChange({ ...v, startDate: newIso });
          }}
          InputLabelProps={{ shrink: true }}
          onKeyDown={preventManualTyping}
          sx={{ flex: 1 }}
        />

        <TextField
          label="Hora inicio"
          type="time"
          value={toTimeInput(v.startDate)}
          onChange={(e) => {
            const newIso = combineDateTime(toDateInput(v.startDate), e.target.value);
            onChange({ ...v, startDate: newIso });
          }}
          InputLabelProps={{ shrink: true }}
          onKeyDown={preventManualTyping}
          sx={{ width: 160 }}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Fecha fin (opcional)"
          type="date"
          value={toDateInput(v.endDate)}
          onChange={(e) => {
            const dateVal = e.target.value;
            if (!dateVal) {
              onChange({ ...v, endDate: null });
              return;
            }
            const newIso = combineDateTime(dateVal, toTimeInput(v.endDate));
            onChange({ ...v, endDate: newIso });
          }}
          InputLabelProps={{ shrink: true }}
          onKeyDown={preventManualTyping}
          sx={{ flex: 1 }}
        />

        <TextField
          label="Hora fin"
          type="time"
          value={toTimeInput(v.endDate)}
          onChange={(e) => {
            const datePart = toDateInput(v.endDate);
            if (!datePart) {
              // if no date yet, keep endDate null until a date is selected
              onChange({ ...v, endDate: null });
              return;
            }
            const newIso = combineDateTime(datePart, e.target.value);
            onChange({ ...v, endDate: newIso });
          }}
          InputLabelProps={{ shrink: true }}
          onKeyDown={preventManualTyping}
          sx={{ width: 160 }}
        />
      </Stack>

      <FormControlLabel
        control={<Checkbox checked={v.notifyOnRun ?? true} onChange={handle('notifyOnRun')} />}
        label="Notificar al ejecutarse"
      />
    </Stack>
  );
};

export default RecurringForm;