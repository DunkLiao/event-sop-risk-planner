import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, MenuItem, Paper, TextField, Typography } from '@mui/material';
import type { UseEventFormReturn } from '../../hooks/useEventForm';
import { EVENT_SCALE_OPTIONS } from '../../utils/constants';
import EventTypeSelector from './EventTypeSelector';

type Step1BasicInfoProps = Pick<UseEventFormReturn, 'values' | 'errors' | 'handleFieldBlur' | 'handleFieldChange'> & {
  disabled?: boolean;
};

const sectionCardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: 3,
  border: 1,
  borderColor: 'divider',
  boxShadow: 'none',
  bgcolor: 'background.paper',
};

const inputGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    md: 'repeat(2, minmax(0, 1fr))',
  },
};

const fullWidthSx = {
  gridColumn: {
    xs: 'span 1',
    md: 'span 2',
  },
};

function Step1BasicInfo({
  values,
  errors,
  handleFieldBlur,
  handleFieldChange,
  disabled = false,
}: Step1BasicInfoProps) {
  return (
    <Paper sx={sectionCardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <InfoOutlinedIcon color="primary" />
        <Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
            活動基本資訊
          </Typography>
          <Typography variant="body2" color="text.secondary">
            先完成核心條件，後續步驟會依此補齊執行細節。
          </Typography>
        </Box>
      </Box>

      <Box sx={inputGridSx}>
        <TextField
          required
          fullWidth
          label="活動名稱"
          placeholder="例如：2026 亞洲創新論壇"
          value={values.name}
          error={Boolean(errors.name)}
          helperText={errors.name ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('name', event.target.value)}
          onBlur={() => handleFieldBlur('name')}
          sx={fullWidthSx}
        />

        <Box sx={fullWidthSx}>
          <EventTypeSelector
            value={values.type}
            error={Boolean(errors.type)}
            helperText={errors.type ?? ' '}
            disabled={disabled}
            onChange={value => handleFieldChange('type', value)}
            onBlur={() => handleFieldBlur('type')}
          />
        </Box>

        <TextField
          select
          required
          fullWidth
          label="活動規模"
          value={values.scale}
          error={Boolean(errors.scale)}
          helperText={errors.scale ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('scale', event.target.value)}
          onBlur={() => handleFieldBlur('scale')}
        >
          {EVENT_SCALE_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          fullWidth
          type="date"
          label="開始日期"
          value={values.startDate}
          error={Boolean(errors.startDate)}
          helperText={errors.startDate ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('startDate', event.target.value)}
          onBlur={() => handleFieldBlur('startDate')}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          required
          fullWidth
          type="date"
          label="結束日期"
          value={values.endDate}
          error={Boolean(errors.endDate)}
          helperText={errors.endDate ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('endDate', event.target.value)}
          onBlur={() => handleFieldBlur('endDate')}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          required
          fullWidth
          label="活動地點"
          placeholder="例如：台北南港展覽館一館"
          value={values.location}
          error={Boolean(errors.location)}
          helperText={errors.location ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('location', event.target.value)}
          onBlur={() => handleFieldBlur('location')}
          sx={fullWidthSx}
        />
      </Box>
    </Paper>
  );
}

export default Step1BasicInfo;
