import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModelSelector from '../../components/ModelSelector';
import React from 'react';

describe('ModelSelector', () => {
  it('renders the configuration title', () => {
    render(<ModelSelector onSelect={() => {}} />);
    expect(screen.getByText(/Configure/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Core/i)).toBeInTheDocument();
  });

  it('saves configuration to localStorage on submit', () => {
    const onSelect = vi.fn();
    render(<ModelSelector onSelect={onSelect} />);
    
    // Select OpenAI
    const providerSelect = screen.getByLabelText(/Select AI Tool/i);
    fireEvent.change(providerSelect, { target: { value: 'openai' } });
    
    // Enter API Key
    const keyInput = screen.getByLabelText(/API Access Key/i);
    fireEvent.change(keyInput, { target: { value: 'sk-test-key' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /Initialize Core/i });
    fireEvent.click(submitButton);
    
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'openai',
      apiKey: 'sk-test-key'
    }));
    
    const saved = localStorage.getItem('edu_quest_ai_config');
    expect(saved).toContain('openai');
    expect(saved).toContain('sk-test-key');
  });

  it('loads saved configuration from localStorage on mount', () => {
    const config = {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-latest',
      apiKey: 'ant-test-key'
    };
    localStorage.setItem('edu_quest_ai_config', JSON.stringify(config));
    
    render(<ModelSelector onSelect={() => {}} />);
    
    expect(screen.getByDisplayValue('Anthropic Claude')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Claude 3.5 Sonnet')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ant-test-key')).toBeInTheDocument();
  });
});
