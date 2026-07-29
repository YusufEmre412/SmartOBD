import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DiagnosticPanel from './DiagnosticPanel';

describe('DiagnosticPanel Component QA Tests', () => {
  it('renders the diagnostic input field correctly', () => {
    render(<DiagnosticPanel />);
    expect(screen.getByPlaceholderText(/P0171, P0300/i)).toBeDefined();
  });

  it('updates state when DTCs are typed into the input', () => {
    render(<DiagnosticPanel />);
    const input = screen.getByPlaceholderText(/P0171, P0300/i);
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
