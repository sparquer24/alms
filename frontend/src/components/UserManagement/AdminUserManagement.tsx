import React, { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import './AdminUserManagement.module.css'; // Assuming a CSS module for styling

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

const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users`);
        const data = await response.json();

        if (data.success) {
          setUsers(data.data);
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('An error occurred while fetching users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (userId: string) => {
    console.log(`Edit user with ID: ${userId}`);
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="admin-content">
        <h1 className="admin-title">Admin User Management</h1>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Office Name</th>
              <th>Phone No</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.officeName}</td>
                <td>{user.phoneNo}</td>
                <td>{user.role.name}</td>
                <td>{new Date(user.createdAt).toLocaleString()}</td>
                <td>
                  <button className="edit-button" onClick={() => handleEdit(user.id)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManagement;
