import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import { Box, Paper, TextField, Typography } from '@mui/material';
import type { UseEventFormReturn } from '../../hooks/useEventForm';

type Step2DetailsProps = Pick<UseEventFormReturn, 'values' | 'errors' | 'handleFieldBlur' | 'handleFieldChange'> & {
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

function Step2Details({
  values,
  errors,
  handleFieldBlur,
  handleFieldChange,
  disabled = false,
}: Step2DetailsProps) {
  return (
    <Paper sx={sectionCardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <NotesRoundedIcon color="primary" />
        <Box>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
            詳細規劃
          </Typography>
          <Typography variant="body2" color="text.secondary">
            補齊人數、預算與背景描述，讓 SOP 與風險規劃更貼近真實情境。
          </Typography>
        </Box>
      </Box>

      <Box sx={inputGridSx}>
        <TextField
          required
          fullWidth
          type="number"
          label="預計參加人數"
          placeholder="例如：350"
          value={values.attendees}
          error={Boolean(errors.attendees)}
          helperText={errors.attendees ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('attendees', event.target.value)}
          onBlur={() => handleFieldBlur('attendees')}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />

        <TextField
          fullWidth
          type="number"
          label="預算（選填）"
          placeholder="例如：500000"
          value={values.budget}
          error={Boolean(errors.budget)}
          helperText={errors.budget ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('budget', event.target.value)}
          onBlur={() => handleFieldBlur('budget')}
          slotProps={{ htmlInput: { min: 0, step: 1000 } }}
        />

        <TextField
          required
          fullWidth
          multiline
          minRows={5}
          label="活動描述"
          placeholder="說明活動目標、主要流程、核心亮點與執行重點。"
          value={values.description}
          error={Boolean(errors.description)}
          helperText={errors.description ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('description', event.target.value)}
          onBlur={() => handleFieldBlur('description')}
          sx={fullWidthSx}
        />
      </Box>
    </Paper>
  );
}

export default Step2Details;
