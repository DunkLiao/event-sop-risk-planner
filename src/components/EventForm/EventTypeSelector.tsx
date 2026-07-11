import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  FormControl,
  FormHelperText,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { EventType } from '../../types/event';
import { EVENT_TYPE_OPTIONS } from '../../utils/constants';
import { getEventTypeIcons } from '../../utils/eventTypeIcons';
import {
  EVENT_TYPE_FILTER_OPTIONS,
  type EventTypeFilterGroup,
  getEventTypeMetadata,
} from '../../utils/eventTypeMetadata';

interface EventTypeSelectorProps {
  value: EventType;
  onChange: (value: EventType) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

function EventTypeSelector({
  value,
  onChange,
  onBlur,
  error = false,
  helperText,
  disabled = false,
}: EventTypeSelectorProps) {
  const [query, setQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<EventTypeFilterGroup | 'all'>('all');

  const eventTypeOptions = useMemo(
    () =>
      EVENT_TYPE_OPTIONS.map(option => {
        const metadata = getEventTypeMetadata(option.value);
        return {
          ...option,
          metadata,
          searchText: [
            option.label,
            metadata.description,
            metadata.typicalScaleRange,
            ...metadata.commonRiskCategories,
            ...metadata.sopFocusItems,
            ...metadata.keywords,
          ]
            .join(' ')
            .toLowerCase(),
        };
      }),
    []
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return eventTypeOptions.filter(option => {
      const matchesGroup = filterGroup === 'all' || option.metadata.filterGroup === filterGroup;
      const matchesQuery = normalizedQuery === '' || option.searchText.includes(normalizedQuery);
      return matchesGroup && matchesQuery;
    });
  }, [eventTypeOptions, filterGroup, query]);

  const selectedOption = eventTypeOptions.find(option => option.value === value) ?? eventTypeOptions[0];
  const selectedMetadata = selectedOption.metadata;

  return (
    <FormControl fullWidth error={error}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            活動類型
          </Typography>
          <Typography variant="body2" color="text.secondary">
            透過搜尋、分類與卡片預覽快速選出最接近的活動型態。
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜尋活動類型、關鍵字或風險提示"
            value={query}
            disabled={disabled}
            onChange={event => setQuery(event.target.value)}
            onBlur={onBlur}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {EVENT_TYPE_FILTER_OPTIONS.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                clickable={!disabled}
                color={filterGroup === option.value ? 'primary' : 'default'}
                variant={filterGroup === option.value ? 'filled' : 'outlined'}
                disabled={disabled}
                onClick={() => setFilterGroup(option.value)}
              />
            ))}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {filteredOptions.map(option => {
            const isSelected = option.value === value;
            const { primary: PrimaryIcon, accent: AccentIcon } = getEventTypeIcons(option.value);

            return (
              <Card
                key={option.value}
                variant="outlined"
                sx={{
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: theme =>
                    isSelected ? alpha(theme.palette.primary.main, 0.08) : theme.palette.background.paper,
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? theme => `0 0 0 1px ${theme.palette.primary.main}` : 'none',
                }}
              >
                <CardActionArea
                  disabled={disabled}
                  onClick={() => {
                    onChange(option.value);
                    onBlur?.();
                  }}
                  sx={{
                    height: '100%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'stretch',
                  }}
                >
                  <Stack spacing={1.5} sx={{ width: '100%', alignItems: 'flex-start' }}>
                    <Stack direction="row" spacing={1.25} sx={{ width: '100%', justifyContent: 'space-between' }}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2.5,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: isSelected ? 'primary.main' : 'action.hover',
                          color: isSelected ? 'primary.contrastText' : 'primary.main',
                        }}
                      >
                        <PrimaryIcon />
                      </Box>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: theme =>
                            isSelected ? alpha(theme.palette.primary.main, 0.14) : theme.palette.grey[100],
                          color: isSelected ? 'primary.dark' : 'text.secondary',
                        }}
                      >
                        <AccentIcon fontSize="small" />
                      </Box>
                    </Stack>

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {option.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {option.metadata.description}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      <Chip size="small" label={option.metadata.typicalScaleRange} variant="outlined" />
                      {option.metadata.commonRiskCategories.slice(0, 1).map(risk => (
                        <Chip key={risk} size="small" label={`風險：${risk}`} color={isSelected ? 'primary' : 'default'} />
                      ))}
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>

        {filteredOptions.length === 0 ? (
          <Box
            sx={{
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              px: 2,
              py: 2.5,
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              找不到符合條件的活動類型，請調整搜尋字詞或切換篩選分類。
            </Typography>
          </Box>
        ) : null}

        <Box
          sx={{
            borderRadius: 3,
            border: 1,
            borderColor: error ? 'error.main' : 'divider',
            bgcolor: 'background.default',
            p: 2,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              已選擇：{selectedOption.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedMetadata.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              典型規模：{selectedMetadata.typicalScaleRange}
            </Typography>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                常見風險提示
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {selectedMetadata.commonRiskCategories.map(risk => (
                  <Chip key={risk} size="small" label={risk} />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                推薦 SOP 重點
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {selectedMetadata.sopFocusItems.map(item => (
                  <Chip key={item} size="small" label={item} color="primary" variant="outlined" />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>

      <FormHelperText>{helperText ?? ' '}</FormHelperText>
    </FormControl>
  );
}

export default EventTypeSelector;
