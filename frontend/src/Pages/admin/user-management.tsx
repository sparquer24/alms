import React, { useEffect, useState } from 'react';
import ApplicationTable from '../../components/ApplicationTable';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users'); // Replace with the actual API endpoint
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>User Management</h1>
      <ApplicationTable users={users} isLoading={isLoading} />
    </div>
  );
};

export default UserManagement;
