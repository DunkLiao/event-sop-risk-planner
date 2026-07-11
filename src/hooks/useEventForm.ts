import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { EventFormData, EventInfo } from '../types/event';
import { buildDraftEventInfo, DEFAULT_EVENT_FORM_VALUES, mapEventToFormData } from '../utils/project';
import { isValidDateRange, validateRequired } from '../utils/validators';

export type EventFormField = keyof EventFormData;
export type EventFormErrors = Partial<Record<EventFormField, string>>;
export type EventFormTouched = Record<EventFormField, boolean>;

export const EVENT_FORM_STEPS = ['活動基本資訊', '詳細規劃', '特殊需求與確認'] as const;

export const EVENT_FORM_STEP_FIELDS: Record<number, EventFormField[]> = {
  0: ['name', 'type', 'scale', 'startDate', 'endDate', 'location'],
  1: ['attendees', 'budget', 'description'],
  2: ['specialRequirements'],
};

const TOTAL_STEPS = EVENT_FORM_STEPS.length;

const buildTouchedState = (value: boolean): EventFormTouched => ({
  name: value,
  type: value,
  scale: value,
  startDate: value,
  endDate: value,
  location: value,
  attendees: value,
  budget: value,
  description: value,
  specialRequirements: value,
});

const toNumber = (value: string): number | undefined => {
  if (value.trim() === '') {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? undefined : numericValue;
};

const clampStep = (step: number): number => Math.min(Math.max(step, 0), TOTAL_STEPS - 1);

const buildEventInfo = (values: EventFormData, existingEvent: EventInfo | null): EventInfo => {
  const nextEvent = buildDraftEventInfo(values, existingEvent);
  return {
    ...nextEvent,
    name: values.name.trim(),
    location: values.location.trim(),
    description: values.description.trim(),
    attendees: Number(values.attendees),
    budget: toNumber(values.budget),
    specialRequirements: values.specialRequirements.trim() || undefined,
  };
};

const validateFormValues = (values: EventFormData): EventFormErrors => {
  const nextErrors: EventFormErrors = {};
  const attendees = toNumber(values.attendees);
  const budget = toNumber(values.budget);

  if (!validateRequired(values.name)) {
    nextErrors.name = '請輸入活動名稱。';
  }

  if (!validateRequired(values.type)) {
    nextErrors.type = '請選擇活動類型。';
  }

  if (!validateRequired(values.scale)) {
    nextErrors.scale = '請選擇活動規模。';
  }

  if (!validateRequired(values.startDate)) {
    nextErrors.startDate = '請選擇開始日期。';
  }

  if (!validateRequired(values.endDate)) {
    nextErrors.endDate = '請選擇結束日期。';
  }

  if (values.startDate && values.endDate && !isValidDateRange(values.startDate, values.endDate)) {
    nextErrors.endDate = '結束日期不得早於開始日期。';
  }

  if (!validateRequired(values.location)) {
    nextErrors.location = '請輸入活動地點。';
  }

  if (!validateRequired(values.attendees)) {
    nextErrors.attendees = '請輸入預計參加人數。';
  } else if (attendees === undefined || !Number.isInteger(attendees) || attendees <= 0) {
    nextErrors.attendees = '請輸入大於 0 的整數。';
  }

  if (values.budget.trim() !== '' && (budget === undefined || budget < 0)) {
    nextErrors.budget = '預算必須為 0 以上的數字。';
  }

  if (!validateRequired(values.description)) {
    nextErrors.description = '請輸入活動描述。';
  }

  return nextErrors;
};

const isStepValid = (errors: EventFormErrors, step: number): boolean =>
  EVENT_FORM_STEP_FIELDS[step].every(field => !errors[field]);

const buildStepErrors = (errors: EventFormErrors): Record<number, string[]> =>
  EVENT_FORM_STEPS.reduce<Record<number, string[]>>((result, _label, index) => {
    result[index] = EVENT_FORM_STEP_FIELDS[index]
      .map(field => errors[field])
      .filter((message): message is string => Boolean(message));
    return result;
  }, {});

const getHighestUnlockedStep = (errors: EventFormErrors, currentStep: number): number => {
  let unlockedStep = 0;

  for (let step = 0; step < TOTAL_STEPS - 1; step += 1) {
    if (!isStepValid(errors, step)) {
      break;
    }

    unlockedStep = step + 1;
  }

  return Math.max(currentStep, clampStep(unlockedStep));
};

const markStepTouched = (previousTouched: EventFormTouched, step: number): EventFormTouched => ({
  ...previousTouched,
  ...EVENT_FORM_STEP_FIELDS[step].reduce<Partial<EventFormTouched>>((result, field) => {
    result[field] = true;
    return result;
  }, {}),
});

export const useEventForm = () => {
  const eventFormData = useAppStore(state => state.eventFormData);
  const currentEvent = useAppStore(state => state.currentEvent);
  const currentStep = useAppStore(state => state.currentStep);
  const setCurrentEvent = useAppStore(state => state.setCurrentEvent);
  const setCurrentStep = useAppStore(state => state.setCurrentStep);
  const setEventFormData = useAppStore(state => state.setEventFormData);
  const projectHydrationKey = useAppStore(state => state.projectHydrationKey);

  const [values, setValues] = useState<EventFormData>(() => {
    if (eventFormData) {
      return eventFormData;
    }

    if (currentEvent) {
      return mapEventToFormData(currentEvent);
    }

    return DEFAULT_EVENT_FORM_VALUES;
  });
  const [errors, setErrors] = useState<EventFormErrors>(() => validateFormValues(values));
  const [touched, setTouched] = useState<EventFormTouched>(() => buildTouchedState(false));
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const nextValues = eventFormData ?? (currentEvent ? mapEventToFormData(currentEvent) : DEFAULT_EVENT_FORM_VALUES);

    setValues(previousValues => {
      if (JSON.stringify(previousValues) === JSON.stringify(nextValues)) {
        return previousValues;
      }

      return nextValues;
    });
    setErrors(validateFormValues(nextValues));
    setTouched(buildTouchedState(false));
    setIsSubmitted(false);
  }, [currentEvent, eventFormData, projectHydrationKey]);

  const visibleErrors = useMemo(
    () =>
      Object.entries(errors).reduce<EventFormErrors>((result, [field, message]) => {
        const typedField = field as EventFormField;

        if (message && (touched[typedField] || isSubmitted)) {
          result[typedField] = message;
        }

        return result;
      }, {}),
    [errors, isSubmitted, touched]
  );

  const stepErrors = useMemo(() => buildStepErrors(errors), [errors]);
  const highestUnlockedStep = useMemo(() => getHighestUnlockedStep(errors, currentStep), [currentStep, errors]);
  const completedSteps = useMemo(
    () =>
      EVENT_FORM_STEPS.map((_, index) =>
        index === TOTAL_STEPS - 1
          ? currentStep === TOTAL_STEPS - 1 && Object.keys(errors).length === 0
          : isStepValid(errors, index)
      ),
    [currentStep, errors]
  );

  const updateValues = useCallback(
    (updater: (previousValues: EventFormData) => EventFormData) => {
      const nextValues = updater(values);
      setValues(nextValues);
      setErrors(validateFormValues(nextValues));
      setEventFormData(nextValues);
    },
    [setEventFormData, values]
  );

  const handleFieldChange = useCallback(
    (field: EventFormField, value: string) => {
      updateValues(previousValues => ({
        ...previousValues,
        [field]: value,
      }));
    },
    [updateValues]
  );

  const handleFieldBlur = useCallback((field: EventFormField) => {
    setTouched(previousTouched => ({
      ...previousTouched,
      [field]: true,
    }));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      const nextStep = clampStep(step);

      if (nextStep <= highestUnlockedStep || nextStep <= currentStep) {
        setCurrentStep(nextStep);
      }
    },
    [currentStep, highestUnlockedStep, setCurrentStep]
  );

  const canGoNext = useCallback((): boolean => {
    if (currentStep >= TOTAL_STEPS - 1) {
      return Object.keys(errors).length === 0;
    }

    return isStepValid(errors, currentStep);
  }, [currentStep, errors]);

  const nextStep = useCallback(() => {
    setTouched(previousTouched => markStepTouched(previousTouched, currentStep));

    if (!canGoNext()) {
      return false;
    }

    setCurrentStep(clampStep(currentStep + 1));
    return true;
  }, [canGoNext, currentStep, setCurrentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(clampStep(currentStep - 1));
  }, [currentStep, setCurrentStep]);

  const resetForm = useCallback(() => {
    const nextValues = DEFAULT_EVENT_FORM_VALUES;
    setValues(nextValues);
    setErrors(validateFormValues(nextValues));
    setTouched(buildTouchedState(false));
    setIsSubmitted(false);
    setCurrentStep(0);
    setEventFormData(null);
    setCurrentEvent(null);
  }, [setCurrentEvent, setCurrentStep, setEventFormData]);

  const submitForm = useCallback(() => {
    const nextErrors = validateFormValues(values);

    setIsSubmitted(true);
    setTouched(buildTouchedState(true));
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return false;
    }

    setCurrentEvent(buildEventInfo(values, currentEvent));
    setEventFormData(values);
    return true;
  }, [currentEvent, setCurrentEvent, setEventFormData, values]);

  return {
    currentStep,
    values,
    errors: visibleErrors,
    allErrors: errors,
    touched,
    isValid: Object.keys(errors).length === 0,
    stepErrors,
    completedSteps,
    highestUnlockedStep,
    handleFieldChange,
    handleFieldBlur,
    goToStep,
    nextStep,
    prevStep,
    canGoNext,
    submitForm,
    resetForm,
  };
};

export type UseEventFormReturn = ReturnType<typeof useEventForm>;
