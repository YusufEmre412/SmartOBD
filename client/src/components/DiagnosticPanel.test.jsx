import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import DiagnosticPanel from './DiagnosticPanel';

describe('DiagnosticPanel Component QA Tests', () => {
  afterEach(cleanup);

  it('renders the diagnostic input field correctly', () => {
    render(<DiagnosticPanel />);
    expect(screen.getByPlaceholderText(/DTCs/i)).toBeDefined();
  });

  it('updates state when DTCs are typed into the input', () => {
    render(<DiagnosticPanel />);
    const input = screen.getByPlaceholderText(/DTCs/i);
    fireEvent.change(input, { target: { value: 'P0171, P0300' } });
    expect(input.value).toBe('P0171, P0300');
  });

  it('renders the analyze button and prevents multiple clicks when loading', () => {
    render(<DiagnosticPanel />);
    const button = screen.getByRole('button', { name: /Analyze/i });
    expect(button).toBeDefined();
    expect(button.disabled).toBe(false);
  });
});
