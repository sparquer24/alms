import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationDropdown from '../components/NotificationDropdown';
import { useNotifications } from '../config/notificationContext';

// Mock the notification context
jest.mock('../config/notificationContext', () => ({
  useNotifications: jest.fn()
}));

describe('NotificationDropdown', () => {
  // Sample notifications for testing
  const mockNotifications = [
    {
      id: '1',
      title: 'Test Notification',
      message: 'This is a test notification',
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'SYSTEM_ALERT'
    },
    {
      id: '2',
      title: 'Another Notification',
      message: 'This is another notification',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      type: 'APPLICATION_STATUS_CHANGE'
    }
  ];

  // Mock functions
  const mockMarkAsRead = jest.fn();
  const mockMarkAllAsRead = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup the mock implementation
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead
    });
  });

  test('renders notification dropdown with correct notifications', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);
    
    // Check if notification titles are rendered
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('Another Notification')).toBeInTheDocument();
    
    // Check if notification messages are rendered
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    expect(screen.getByText('This is another notification')).toBeInTheDocument();
    
    // Check if "Mark all as read" button exists
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
  });

  test('calls markAllAsRead when "Mark all as read" button is clicked', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);
    
    // Click the "Mark all as read" button
    fireEvent.click(screen.getByText('Mark all as read'));
    
    // Check if markAllAsRead was called
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  test('calls markAsRead when a notification is clicked', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);
    
    // Click on the first notification
    fireEvent.click(screen.getByText('Test Notification'));
    
    // Check if markAsRead was called with the correct ID
    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
  });

  test('renders empty state when no notifications', () => {
    // Override the mock to return empty notifications
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead
    });
    
    render(<NotificationDropdown onClose={mockOnClose} />);
    
    // Check if empty state message is displayed
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  test('renders unread indicator for unread notifications', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);
    
    // Get all list items
    const listItems = screen.getAllByRole('listitem');
    
    // Check that the first notification (unread) has the right background class
    expect(listItems[0]).toHaveClass('bg-indigo-50');
    
    // Check that the second notification (read) doesn't have the background class
    expect(listItems[1]).not.toHaveClass('bg-indigo-50');
  });

  test('calls onClose when clicking outside', () => {
    // Create a container that simulates clicking outside
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    render(<NotificationDropdown onClose={mockOnClose} />, { container });
    
    // Simulate a mousedown event outside the dropdown
    fireEvent.mouseDown(document);
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Clean up
    document.body.removeChild(container);
  });
});
