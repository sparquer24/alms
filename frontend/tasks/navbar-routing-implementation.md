# Navbar Routing Implementation

## Objective
Implement routing for the navbar such that clicking on any navbar item updates the URL to the respective route and renders the corresponding component. Additionally, ensure that the respective APIs are called for each route.

---

## Steps to Implement

### 1. Update Navbar Component
- Ensure the `Navbar` component has links for each item.
- Use `next/link` for navigation to update the URL dynamically.

#### Example Code:
```tsx
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/applications">Applications</Link></li>
        <li><Link href="/notifications">Notifications</Link></li>
        <li><Link href="/settings">Settings</Link></li>
        so on...
      </ul>
    </nav>
  );
};

export default Navbar;
```

---

### 2. Define Routes in `pages` Directory
- Create a file for each route in the `pages` directory.
- Each file should render the respective component and call the necessary APIs.

#### Example:

**File:** `pages/dashboard.tsx`
```tsx
import Dashboard from '../src/components/Dashboard';

const DashboardPage = () => {
  return <Dashboard />;
};

export default DashboardPage;
```

**File:** `pages/applications.tsx`
```tsx
import ApplicationTable from '../src/components/ApplicationTable';

const ApplicationsPage = () => {
  return <ApplicationTable />;
};

export default ApplicationsPage;
```

**File:** `pages/notifications.tsx`
```tsx
import Notifications from '../src/components/Notifications';

const NotificationsPage = () => {
  return <Notifications />;
};

export default NotificationsPage;
```

**File:** `pages/settings.tsx`
```tsx
import Settings from '../src/components/Settings';

const SettingsPage = () => {
  return <Settings />;
};

export default SettingsPage;
```

---

### 3. Create Components for Each Route
- Ensure each route has a corresponding component in the `src/components` directory.
- Fetch data from the respective APIs in these components.

#### Example:

**File:** `src/components/Dashboard.tsx`
```tsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../config/APIsEndpoints';

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData().then(response => setData(response));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
};

export default Dashboard;
```

---

### 4. Update API Endpoints
- Ensure all API endpoints are defined in `src/config/APIsEndpoints.ts`.

#### Example:
```ts
export const fetchDashboardData = async () => {
  const response = await fetch('/api/dashboard');
  return response.json();
};

export const fetchApplicationsData = async () => {
  const response = await fetch('/api/applications');
  return response.json();
};

export const fetchNotificationsData = async () => {
  const response = await fetch('/api/notifications');
  return response.json();
};

export const fetchSettingsData = async () => {
  const response = await fetch('/api/settings');
  return response.json();
};
```

---

### 5. Test the Implementation
- Verify that clicking on each navbar item updates the URL and renders the correct component.
- Ensure the respective APIs are called and data is displayed correctly.

---

## Additional Notes
- Use `useRouter` from `next/router` if dynamic routing is required.
- Ensure proper error handling for API calls.
- Add loading states for better user experience.

---

## Completion Criteria
- Navbar items update the URL and render the correct components.
- APIs are called and data is displayed for each route.
- No console errors or warnings during navigation.

---

## References
- [Next.js Routing Documentation](https://nextjs.org/docs/routing/introduction)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
