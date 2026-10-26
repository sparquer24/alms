import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProceedingsForm from '../components/ProceedingsForm';
import { fetchData, postData } from '../api/axiosConfig';
import { getCookie } from 'cookies-next';

jest.mock('../api/axiosConfig', () => ({
  fetchData: jest.fn(),
  postData: jest.fn(),
  setAuthToken: jest.fn(),
}));

jest.mock('cookies-next', () => ({ getCookie: jest.fn() }));

jest.mock('../components/TiptapRichTextEditor', () => ({
  TiptapRichTextEditor: ({ value, onChange, disabled }: any) => (
    <textarea aria-label='Remarks' value={value} onChange={e => onChange(e.target.value)} disabled={disabled} />
  ),
}));

// react-select as a plain <select>, labelled by its placeholder.
jest.mock('react-select', () =>
  function MockSelect({ options, value, onChange, placeholder, isDisabled }: any) {
    return (
      <select
        aria-label={placeholder}
        value={value?.value ?? ''}
        onChange={e => onChange(options.find((o: any) => String(o.value) === e.target.value) ?? null)}
        disabled={isDisabled}
      >
        <option value=''>{placeholder}</option>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
);

const mockFetchData = fetchData as jest.Mock;
const mockPostData = postData as jest.Mock;
const mockGetCookie = getCookie as jest.Mock;

const ACTIONS = [
  { id: 1, code: 'FORWARD', name: 'Forward', isActive: true },
  { id: 2, code: 'REJECT', name: 'Reject', isActive: true },
];
const USERS = [{ id: 7, username: 'ACP_ABD_HYD', roleCode: 'ACP' }];
const RULE = {
  approverRoleCode: 'CP',
  approverRoleName: 'Commissioner of Police',
  decision: 'APPROVE',
  area: 'DISTRICT',
  purpose: 'SPORTS',
  isCurrentUserDecisionRole: false,
};

function mockApi({ actions = ACTIONS, failActions = false } = {}) {
  mockFetchData.mockImplementation((url: string) => {
    if (url.startsWith('/actiones')) return failActions ? Promise.reject(new Error('Network down')) : Promise.resolve(actions);
    if (url.startsWith('/users-in-hierarchy')) return Promise.resolve(USERS);
    if (url.startsWith('/approval-rules/application')) return Promise.resolve({ data: RULE });
    return Promise.resolve([]);
  });
}

function setRole(role: string | undefined) {
  mockGetCookie.mockImplementation((key: string) => (key === 'role' ? role : undefined));
}

async function renderForm(props: Partial<React.ComponentProps<typeof ProceedingsForm>> = {}) {
  render(<ProceedingsForm applicationId='42' {...props} />);
  await waitFor(() => expect(screen.getByLabelText('Select action type')).not.toBeDisabled());
  await waitFor(() => expect(screen.getByLabelText('Select user (next proceeding officer)')).not.toBeDisabled());
}

async function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Select action type'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Select user (next proceeding officer)'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Remarks'), { target: { value: '<p>Verified, forwarding</p>' } });
}

describe('ProceedingsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setRole('ZS');
    mockApi();
  });

  it('loads the actions and the next officers into the form', async () => {
    await renderForm();

    expect(screen.getByRole('option', { name: 'Forward' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ACP_ABD_HYD (ACP)' })).toBeInTheDocument();
    expect(mockFetchData).toHaveBeenCalledWith(expect.stringContaining('/users-in-hierarchy/42'));
    expect(screen.getByRole('button', { name: 'Submit Action' })).toBeEnabled();
  });

  it('falls back to the default actions when they cannot be loaded', async () => {
    mockApi({ failActions: true });
    await renderForm();

    expect(screen.getByRole('option', { name: 'Forward' })).toBeInTheDocument();
    expect(screen.getByText(/Failed to load actions from server/)).toBeInTheDocument();
  });

  it('flags every missing field and sends nothing', async () => {
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Submit Action' }));

    expect(await screen.findByText('Please fix the highlighted fields and try again.')).toBeInTheDocument();
    expect(screen.getByText('Please select an action type.')).toBeInTheDocument();
    expect(screen.getByText('Please add remarks before submitting.')).toBeInTheDocument();
    expect(mockPostData).not.toHaveBeenCalled();
  });

  it('asks for confirmation, then sends the action and reports success', async () => {
    mockPostData.mockResolvedValue({ message: 'Forwarded to ACP_ABD_HYD' });
    const onSuccess = jest.fn();
    await renderForm({ onSuccess });
    await fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Submit Action' }));
    expect(mockPostData).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole('button', { name: 'Yes, Forward' }));

    await waitFor(() =>
      expect(mockPostData).toHaveBeenCalledWith('/workflow/action', {
        applicationId: 42,
        actionId: 1,
        remarks: '<p>Verified, forwarding</p>',
        applicationType: 'FreshLicenseApplicationForm',
        attachments: [],
        nextUserId: 7,
      })
    );
    expect(await screen.findByText('Forwarded to ACP_ABD_HYD')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows the error and keeps the form when the action fails', async () => {
    mockPostData.mockRejectedValue(new Error('Application is with another officer'));
    const onSuccess = jest.fn();
    await renderForm({ onSuccess });
    await fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Submit Action' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, Forward' }));

    expect(await screen.findByText('Application is with another officer')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Remarks')).toHaveValue('<p>Verified, forwarding</p>');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error message' }));
    expect(screen.queryByText('Application is with another officer')).not.toBeInTheDocument();
  });

  it('shows who makes the final decision to CP and DCP only', async () => {
    const decisionNote = 'Sports / target shooting · District-wide: final decision by Commissioner of Police (CP) — Approve or Reject.';

    setRole('CP');
    const { unmount } = render(<ProceedingsForm applicationId='42' />);
    expect(await screen.findByText(decisionNote)).toBeInTheDocument();
    unmount();

    setRole('ZS');
    await renderForm();
    await waitFor(() => expect(mockFetchData).toHaveBeenCalledWith(expect.stringContaining('/approval-rules/application')));
    expect(screen.queryByText(decisionNote)).not.toBeInTheDocument();
  });
});
