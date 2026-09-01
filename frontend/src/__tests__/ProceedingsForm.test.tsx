import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import ProceedingsForm from '../components/ProceedingsForm';

// Mock the dynamic import for RichTextEditor
jest.mock('next/dynamic', () => () => {
  return function MockRichTextEditor({ value, onChange, placeholder, disabled }: any) {
    return (
      <textarea
        data-testid="rich-text-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  };
});

// Mock react-select
jest.mock('react-select', () => {
  return function MockSelect({ options, value, onChange, placeholder, isLoading: _isLoading, isDisabled }: any) {
    return (
      <select
        data-testid="select"
        value={value?.value || ''}
        onChange={(e) => {
          const option = options.find((opt: any) => opt.value === e.target.value);
          onChange(option);
        }}
        disabled={isDisabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('ProceedingsForm', () => {
  const mockApplicationId = 'APP123';
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders the form with all required elements', () => {
    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Proceedings Form')).toBeInTheDocument();
    expect(screen.getByText(`Process application #${mockApplicationId}`)).toBeInTheDocument();
    expect(screen.getByText('Action Type *')).toBeInTheDocument();
    expect(screen.getByText('Remarks *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Action' })).toBeInTheDocument();
  });

  it('shows loading state for rich text editor fallback', () => {
    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    // The fallback should show while the rich text editor loads
    expect(screen.getByText('Loading rich text editor...')).toBeInTheDocument();
  });

  it('displays error message when validation fails', async () => {
    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: 'Submit Action' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select an action type.')).toBeInTheDocument();
    });
  });

  it('shows loading state when fetching users for forward action', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ users: [{ id: '1', name: 'User 1' }] })
          });
        }, 100);
      })
    );

    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    const actionSelect = screen.getByTestId('select');
    fireEvent.change(actionSelect, { target: { value: 'forward' } });

    await waitFor(() => {
      expect(screen.getByText('Loading available users...')).toBeInTheDocument();
    });
  });

  it('handles successful form submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Action completed successfully' })
    });

    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    // Fill out the form
    const actionSelect = screen.getByTestId('select');
    fireEvent.change(actionSelect, { target: { value: 'return' } });

    const remarksEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(remarksEditor, { target: { value: 'Test remarks' } });

    const submitButton = screen.getByRole('button', { name: 'Submit Action' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Action completed successfully')).toBeInTheDocument();
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('handles form submission errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Server error occurred' })
    });

    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    // Fill out the form
    const actionSelect = screen.getByTestId('select');
    fireEvent.change(actionSelect, { target: { value: 'return' } });

    const remarksEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(remarksEditor, { target: { value: 'Test remarks' } });

    const submitButton = screen.getByRole('button', { name: 'Submit Action' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
    });
  });

  it('shows forward user selection when forward action is selected', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        users: [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' }
        ] 
      })
    });

    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    const actionSelect = screen.getByTestId('select');
    fireEvent.change(actionSelect, { target: { value: 'forward' } });

    await waitFor(() => {
      expect(screen.getByText('Next User *')).toBeInTheDocument();
    });
  });

  it('validates required fields for forward action', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        users: [
          { id: '1', name: 'User 1' }
        ] 
      })
    });

    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    // Select forward action
    const actionSelect = screen.getByTestId('select');
    fireEvent.change(actionSelect, { target: { value: 'forward' } });

    await waitFor(() => {
      expect(screen.getByText('Next User *')).toBeInTheDocument();
    });

    // Try to submit without selecting a user
    const remarksEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(remarksEditor, { target: { value: 'Test remarks' } });

    const submitButton = screen.getByRole('button', { name: 'Submit Action' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select a user to forward to.')).toBeInTheDocument();
    });
  });

  it('allows dismissing error and success messages', async () => {
    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    // Trigger an error
    const submitButton = screen.getByRole('button', { name: 'Submit Action' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select an action type.')).toBeInTheDocument();
    });

    // Dismiss the error
    const dismissButton = screen.getByLabelText('Dismiss error message');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Please select an action type.')).not.toBeInTheDocument();
    });
  });

  it('disables form elements during submission', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' })
          });
        }, 100);
      })
    );

    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    // Fill out the form
    const actionSelect = screen.getByTestId('select');
    fireEvent.change(actionSelect, { target: { value: 'return' } });

    const remarksEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(remarksEditor, { target: { value: 'Test remarks' } });

    const submitButton = screen.getByRole('button', { name: 'Submit Action' });
    fireEvent.click(submitButton);

    // Check that form elements are disabled during submission
    await waitFor(() => {
      expect(actionSelect).toBeDisabled();
      expect(remarksEditor).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  it('shows loading spinner during submission', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' })
          });
        }, 100);
      })
    );

    render(<ProceedingsForm applicationId={mockApplicationId} onSuccess={mockOnSuccess} />);

    // Fill out the form
    const actionSelect = screen.getByTestId('select');
    fireEvent.change(actionSelect, { target: { value: 'return' } });

    const remarksEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(remarksEditor, { target: { value: 'Test remarks' } });

    const submitButton = screen.getByRole('button', { name: 'Submit Action' });
    fireEvent.click(submitButton);

    // Check that loading text appears
    await waitFor(() => {
      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
  });
}); 