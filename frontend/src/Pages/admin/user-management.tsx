import React, { useEffect, useState } from 'react';
import ApplicationTable from '../../components/ApplicationTable';
import { fetchData } from '../../api/axiosConfig';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await fetchData('/users');
        setUsers(data);
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
