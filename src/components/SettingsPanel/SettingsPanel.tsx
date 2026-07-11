import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { storageService } from '../../services/storage/storageService';
import { defaultSettings, sanitizeAppSettings, useSettingsStore } from '../../store/settingsStore';
import type { AIProvider, AppSettings } from '../../types/settings';
import { testApiKeyConnection } from '../../utils/apiKeyValidator';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

type ProviderFeedback = Record<AIProvider, { severity: 'success' | 'error'; message: string } | null>;
type ProviderState = Record<AIProvider, string | null>;
type ProviderInputState = Record<AIProvider, string>;
type ProviderLoadingState = Record<AIProvider, boolean>;

const MODEL_OPTIONS: Record<AIProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o-mini'],
  claude: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-7-sonnet-latest'],
};

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  claude: 'Claude',
};

const createProviderFeedback = (): ProviderFeedback => ({
  openai: null,
  claude: null,
});

const createProviderLoading = (): ProviderLoadingState => ({
  openai: false,
  claude: false,
});

function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const setStoredSettings = useSettingsStore(state => state.setSettings);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [apiKeyInputs, setApiKeyInputs] = useState<ProviderInputState>({ openai: '', claude: '' });
  const [maskedKeys, setMaskedKeys] = useState<ProviderState>({ openai: null, claude: null });
  const [feedback, setFeedback] = useState<ProviderFeedback>(createProviderFeedback);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<ProviderLoadingState>(createProviderLoading);
  const [removing, setRemoving] = useState<ProviderLoadingState>(createProviderLoading);
  const [statusMessage, setStatusMessage] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      setStatusMessage(null);

      try {
        const [storedSettings, openaiKey, claudeKey] = await Promise.all([
          storageService.getSettings(),
          storageService.getApiKey('openai'),
          storageService.getApiKey('claude'),
        ]);
        const nextSettings = sanitizeAppSettings(storedSettings ?? defaultSettings);

        setSettings(nextSettings);
        setStoredSettings(nextSettings);
        setMaskedKeys({ openai: openaiKey, claude: claudeKey });
        setApiKeyInputs({ openai: '', claude: '' });
        setFeedback(createProviderFeedback());
      } catch (error) {
        setStatusMessage({
          severity: 'error',
          message: error instanceof Error ? error.message : '載入設定失敗。',
        });
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [open, setStoredSettings]);

  const providerSummaries = useMemo(
    () =>
      (Object.keys(PROVIDER_LABELS) as AIProvider[]).map(provider => ({
        provider,
        label: PROVIDER_LABELS[provider],
        maskedKey: maskedKeys[provider],
        hasKey: Boolean(maskedKeys[provider]),
      })),
    [maskedKeys]
  );

  const handleProviderSettingChange = (
    provider: AIProvider,
    key: 'model' | 'temperature' | 'maxTokens',
    value: number | string
  ) => {
    setSettings(currentSettings => ({
      ...currentSettings,
      ai: {
        ...currentSettings.ai,
        [provider]: {
          ...currentSettings.ai[provider],
          [key]: value,
        },
      },
    }));
  };

  const handleApiKeyInputChange =
    (provider: AIProvider) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setApiKeyInputs(currentInputs => ({
        ...currentInputs,
        [provider]: event.target.value,
      }));
      setFeedback(currentFeedback => ({
        ...currentFeedback,
        [provider]: null,
      }));
    };

  const handleTestConnection = async (provider: AIProvider) => {
    const apiKey = apiKeyInputs[provider].trim();

    if (!apiKey) {
      setFeedback(currentFeedback => ({
        ...currentFeedback,
        [provider]: {
          severity: 'error',
          message: '請先輸入 API Key 後再測試連線。',
        },
      }));
      return;
    }

    setTesting(currentState => ({
      ...currentState,
      [provider]: true,
    }));

    try {
      const validation = await storageService.validateApiKey(provider, apiKey);

      if (!validation.isValid) {
        setFeedback(currentFeedback => ({
          ...currentFeedback,
          [provider]: {
            severity: 'error',
            message: validation.message,
          },
        }));
        return;
      }

      const result = await testApiKeyConnection(provider, apiKey);

      setFeedback(currentFeedback => ({
        ...currentFeedback,
        [provider]: {
          severity: result.success ? 'success' : 'error',
          message: result.message,
        },
      }));
    } finally {
      setTesting(currentState => ({
        ...currentState,
        [provider]: false,
      }));
    }
  };

  const handleRemoveApiKey = async (provider: AIProvider) => {
    setRemoving(currentState => ({
      ...currentState,
      [provider]: true,
    }));

    try {
      await storageService.removeApiKey(provider);
      setMaskedKeys(currentState => ({
        ...currentState,
        [provider]: null,
      }));
      setApiKeyInputs(currentState => ({
        ...currentState,
        [provider]: '',
      }));
      setFeedback(currentFeedback => ({
        ...currentFeedback,
        [provider]: {
          severity: 'success',
          message: 'API Key 已移除。',
        },
      }));
    } catch (error) {
      setFeedback(currentFeedback => ({
        ...currentFeedback,
        [provider]: {
          severity: 'error',
          message: error instanceof Error ? error.message : '移除 API Key 失敗。',
        },
      }));
    } finally {
      setRemoving(currentState => ({
        ...currentState,
        [provider]: false,
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      const sanitizedSettings = sanitizeAppSettings(settings);
      const pendingProviders = (Object.keys(apiKeyInputs) as AIProvider[]).filter(
        provider => apiKeyInputs[provider].trim() !== ''
      );

      for (const provider of pendingProviders) {
        const validation = await storageService.validateApiKey(provider, apiKeyInputs[provider]);

        if (!validation.isValid) {
          setFeedback(currentFeedback => ({
            ...currentFeedback,
            [provider]: {
              severity: 'error',
              message: validation.message,
            },
          }));
          setSaving(false);
          return;
        }
      }

      await storageService.saveSettings(sanitizedSettings);

      if (pendingProviders.length > 0) {
        const saveResults = await Promise.all(
          pendingProviders.map(provider => storageService.saveApiKey(provider, apiKeyInputs[provider]))
        );

        const nextMaskedKeys = { ...maskedKeys };
        const nextFeedback = { ...feedback };

        pendingProviders.forEach((provider, index) => {
          const result = saveResults[index];
          nextMaskedKeys[provider] = result.maskedKey;
          nextFeedback[provider] = {
            severity: result.success ? 'success' : 'error',
            message: result.message,
          };
        });

        setMaskedKeys(nextMaskedKeys);
        setFeedback(nextFeedback);
        setApiKeyInputs({ openai: '', claude: '' });
      }

      setStoredSettings(sanitizedSettings);
      setStatusMessage({
        severity: 'success',
        message: '設定已儲存。',
      });
    } catch (error) {
      setStatusMessage({
        severity: 'error',
        message: error instanceof Error ? error.message : '儲存設定失敗。',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>設定</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {statusMessage ? <Alert severity={statusMessage.severity}>{statusMessage.message}</Alert> : null}

          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
              AI Provider
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="default-provider-label">預設模型提供商</InputLabel>
                <Select
                  labelId="default-provider-label"
                  label="預設模型提供商"
                  value={settings.ai.defaultProvider}
                  onChange={event =>
                    setSettings(currentSettings => ({
                      ...currentSettings,
                      ai: {
                        ...currentSettings.ai,
                        defaultProvider: event.target.value as AIProvider,
                      },
                    }))
                  }
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="claude">Claude</MenuItem>
                </Select>
              </FormControl>

              {providerSummaries.map(({ provider, label, maskedKey, hasKey }) => (
                <Box
                  key={provider}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: theme => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {label}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                          {hasKey ? (
                            <CheckCircleOutlineRoundedIcon color="success" fontSize="small" />
                          ) : (
                            <CancelOutlinedIcon color="disabled" fontSize="small" />
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {hasKey ? `已儲存：${maskedKey}` : '尚未儲存 API Key'}
                          </Typography>
                        </Stack>
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          variant="outlined"
                          color="inherit"
                          startIcon={<ScienceRoundedIcon />}
                          disabled={testing[provider] || loading}
                          onClick={() => void handleTestConnection(provider)}
                        >
                          {testing[provider] ? '測試中...' : '測試連線'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineRoundedIcon />}
                          disabled={removing[provider] || !hasKey}
                          onClick={() => void handleRemoveApiKey(provider)}
                        >
                          {removing[provider] ? '移除中...' : '移除'}
                        </Button>
                      </Stack>
                    </Stack>

                    <TextField
                      fullWidth
                      type="password"
                      label={`${label} API Key`}
                      value={apiKeyInputs[provider]}
                      onChange={handleApiKeyInputChange(provider)}
                      placeholder={maskedKey ?? `請輸入 ${label} API Key`}
                      helperText="API Key 只會儲存在 Electron 主程序的安全儲存中。"
                    />

                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {
                          xs: 'minmax(0, 1fr)',
                          md: '1fr 1fr',
                        },
                      }}
                    >
                      <FormControl fullWidth>
                        <InputLabel id={`${provider}-model-label`}>模型</InputLabel>
                        <Select
                          labelId={`${provider}-model-label`}
                          label="模型"
                          value={settings.ai[provider].model}
                          onChange={event =>
                            handleProviderSettingChange(provider, 'model', event.target.value)
                          }
                        >
                          {MODEL_OPTIONS[provider].map(model => (
                            <MenuItem key={model} value={model}>
                              {model}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        type="number"
                        label="Max Tokens"
                        value={settings.ai[provider].maxTokens}
                        onChange={event =>
                          handleProviderSettingChange(
                            provider,
                            'maxTokens',
                            Math.max(1, Number(event.target.value) || 1)
                          )
                        }
                        slotProps={{
                          htmlInput: { min: 1, step: 100 },
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography gutterBottom>Temperature：{settings.ai[provider].temperature.toFixed(1)}</Typography>
                      <Slider
                        value={settings.ai[provider].temperature}
                        min={0}
                        max={1}
                        step={0.1}
                        marks
                        onChange={(_event, value) =>
                          handleProviderSettingChange(provider, 'temperature', value as number)
                        }
                      />
                    </Box>

                    {feedback[provider] ? (
                      <Alert severity={feedback[provider].severity}>{feedback[provider].message}</Alert>
                    ) : null}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          <Divider />

          <Typography variant="body2" color="text.secondary">
            {loading
              ? '正在載入設定...'
              : '敏感資訊不會寫入 localStorage，僅保存非敏感設定到一般設定儲存。'}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          關閉
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={() => void handleSave()}
          disabled={saving || loading}
        >
          {saving ? '儲存中...' : '儲存設定'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsPanel;
