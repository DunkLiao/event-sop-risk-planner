import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../../store/appStore';
import EventForm from '..';

describe('EventForm', () => {
  afterEach(() => {
    useAppStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('updates form fields without triggering a render-phase store update warning', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<EventForm />);
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '年度論壇' } });

    expect(
      consoleError.mock.calls.some(call => call.some(value => String(value).includes('Cannot update a component')))
    ).toBe(false);
  }, 10000);
});
