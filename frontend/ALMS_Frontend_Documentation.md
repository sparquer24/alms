# ALMS Frontend Documentation

## Workflow Overview

The ALMS frontend is a React-based application built with Next.js. It provides a role-based navigation system and dynamic user interactions. Here's an overview of the workflow:

1. **Navigation**:
   - The `Sidebar` and `Navbar` components handle navigation.
   - Role-based redirection ensures users are directed to appropriate sections based on their roles (e.g., Admins to the dashboard, DCP/ACP to reports).

2. **User Interactions**:
   - Users interact with forms, tables, and modals for tasks like managing applications, viewing reports, and updating settings.
   - Components like `ApplicationTable` and `BatchProcessingModal` provide dynamic and interactive UI elements.

3. **Data Flow**:
   - The application uses Redux for state management (`authSlice` for authentication state).
   - API calls fetch data (e.g., user details, application data) and update the Redux store.
   - Components subscribe to the store to reflect real-time updates.

---

## API Integration

### APIs Used
- **Authentication API**:
  - Endpoint: `/api/auth`
  - Used in `Login` and `AuthInitializer` components to manage user sessions.
  - Returns tokens and user details.

- **User Management API**:
  - Endpoint: `/api/users`
  - Used in `AdminUserManagement` to fetch and manage user data.
  - Returns a list of users with details like `id`, `username`, `role`, etc.

- **Application API**:
  - Endpoint: `/api/applications`
  - Used in `ApplicationDetailPage` and `InboxPage` to fetch application data.
  - Returns application details like `id`, `status`, `createdAt`, etc.

### API Call Locations
- `src/config/APIClient.ts`: Centralized API client configuration.
- `src/pages/admin/user-management.tsx`: Example of API usage for fetching user data.

---

## Login Handling

### Authentication Flow
1. **Startup**:
   - `AuthInitializer` restores authentication state from cookies or local storage.
   - If no valid session is found, users are redirected to `/login`.

2. **Login**:
   - The `Login` page dispatches the `setCredentials` action upon successful login.
   - Tokens are stored in cookies for session persistence.

3. **Session Management**:
   - Middleware (`src/middleware.ts`) protects routes by checking authentication status.
   - Role-based redirection is handled using `getRoleBasedRedirectPath` in `roleRedirections.ts`.

---

## Data Pattern

### Data Structures
- **User Data**:
  ```typescript
  interface User {
    id: string;
    username: string;
    officeName: string;
    phoneNo: string;
    role: {
      id: number;
      name: string;
    };
    createdAt: string;
  }
  ```

- **Application Data**:
  ```typescript
  interface ApplicationData {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }
  ```

- **Redux State**:
  - `authSlice` manages authentication state:
    ```typescript
    interface AuthState {
      user: User | null;
      token: string | null;
      isAuthenticated: boolean;
      loading: boolean;
      error: string | null;
    }
    ```

---

## Folder Structure

### Overview
```
src/
├── app/                # Next.js app directory for routing and layouts
├── components/         # Reusable React components
├── config/             # Configuration files (e.g., API client, auth logic)
├── context/            # React context for global state
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages for routing
├── store/              # Redux store and slices
├── styles/             # Global and component-specific styles
├── tasks/              # Documentation and implementation guides
```

### Key Folders and Files
- **`src/app/`**:
  - Contains route-specific components (e.g., `login`, `settings`, `inbox`).
  - `layout.tsx`: Root layout for the application.

- **`src/components/`**:
  - `Sidebar.tsx`: Handles navigation.
  - `ApplicationTable.tsx`: Displays user or application data in a table format.

- **`src/config/`**:
  - `APIClient.ts`: Centralized API client configuration.
  - `roleRedirections.ts`: Logic for role-based redirection.

- **`src/store/`**:
  - `authSlice.ts`: Redux slice for authentication state.

- **`styles/`**:
  - `globals.css`: Global styles for the application.

- **`tasks/`**:
  - Contains markdown files documenting implementation details (e.g., `role-based-redirection-guide.md`).

---

This documentation should provide a comprehensive understanding of the ALMS frontend for new developers or contributors. Let me know if you need further details!
