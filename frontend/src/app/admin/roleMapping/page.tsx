"use client";

import { Sidebar } from "../../../components/Sidebar";
import { SetStateAction, useState } from "react";

export default function RoleMappingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState([
    { id: 1, name: "Admin", description: "System administrator with full access" },
    { id: 2, name: "User", description: "Regular user with limited access" },
  ]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  const handleAddRole = () => {
    setRoles([
      ...roles,
      {
        id: Date.now(),
        name: "",
        description: "",
      },
    ]);
  };

  const handleDeleteRole = (roleId: number) => {
    setRoles(roles.filter((role) => role.id !== roleId));
  };

  const handleEditRole = (role: { id: number; name: string; description: string }) => {
    // Implement the edit functionality here
  };

  const handleAddRoleSave = () => {
    if (!newRole.name || !newRole.description) {
      alert("Both fields are required.");
      return;
    }
    setRoles([...roles, { id: Date.now(), ...newRole }]);
    setShowAddRoleModal(false);
    setNewRole({ name: "", description: "" });
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Role Mapping</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center gap-4">
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowAddRoleModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Role
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 w-full max-w-5xl md:max-w-6xl">
            <table className="w-full text-base mb-4 border-separate border-spacing-y-3">
              <thead>
                <tr className="bg-gray-100 text-gray-800 rounded-2xl">
                  <th className="py-4 px-4 text-left rounded-tl-2xl">S.No</th>
                  <th className="py-4 px-4 text-left">Role Name</th>
                  <th className="py-4 px-4 text-left">Description</th>
                  <th className="py-4 px-4 text-left rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles
                  .filter((role) =>
                    role.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((role, index) => (
                    <tr
                      key={role.id}
                      className="bg-white shadow-md rounded-2xl hover:shadow-lg transition-all"
                    >
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">{role.name}</td>
                      <td className="py-3 px-4">{role.description}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {showAddRoleModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Role</h2>
                <div className="flex flex-col gap-3">
                  <input
                    className="border rounded-lg px-3 py-2"
                    placeholder="Role Name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                  <input
                    className="border rounded-lg px-3 py-2"
                    placeholder="Description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  />
                  <div className="flex gap-3 justify-end mt-4">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                      onClick={handleAddRoleSave}
                    >
                      Save
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-300 rounded-lg font-semibold"
                      onClick={() => setShowAddRoleModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
