"use client";

import { Sidebar } from "../../../components/Sidebar";
import { useState, useEffect } from "react";
import Select from "react-select";
import toast from "react-hot-toast";

type User = {
  id: number;
  name: string;
  role: string;
  office: string;
};

type SelectOption = {
  value: number;
  label: string;
};

export default function FlowMappingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<SelectOption | null>(null);
  const [nextUsers, setNextUsers] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  const mockUsers: User[] = [
    { id: 1, name: "Alice Johnson", role: "Manager", office: "New York" },
    { id: 2, name: "Bob Smith", role: "Developer", office: "San Francisco" },
    { id: 3, name: "Charlie Brown", role: "Designer", office: "Chicago" },
    { id: 4, name: "Diana Prince", role: "HR", office: "Boston" },
  ];

  const mockCurrentUser: SelectOption = {
    value: mockUsers[0].id,
    label: `${mockUsers[0].name} (${mockUsers[0].role}, ${mockUsers[0].office})`,
  };

  const mockNextUsers: SelectOption[] = mockUsers.slice(1).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.role}, ${user.office})`,
  }));

  useEffect(() => {
    setLoading(true);
    setUsers(mockUsers);
    setCurrentUser(mockCurrentUser);
    setNextUsers(mockNextUsers);
    setLoading(false);
  }, []);

  const handleSubmit = () => {
    if (!currentUser || nextUsers.length === 0) {
      toast.error("Please select a user and at least one next user.");
      return;
    }

    // Save flow mapping
    fetch("/flow-mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUser, nextUsers }),
    })
      .then((res) => {
        if (res.ok) {
          toast.success("Flow mapping saved successfully.");
        } else {
          toast.error("Failed to save flow mapping.");
        }
      })
      .catch(() => toast.error("An error occurred."));
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Flow Mapping</h1>
            <p className="text-sm text-gray-600 mt-1">
              Define next-user workflow for any role in the system.
            </p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-5xl md:max-w-6xl">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Current User
              </label>
              <Select
                options={users.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.role}, ${u.office})`,
                }))}
                isLoading={loading}
                placeholder="Select a user to configure their flow"
                onChange={(selected) => setCurrentUser(selected as SelectOption)}
                value={currentUser}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Next Users
              </label>
              <Select
                options={users
                  .filter((u) => !nextUsers.some((selected) => selected.value === u.id))
                  .map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.role}, ${u.office})`,
                  }))}
                isMulti
                placeholder="Select next approvers"
                onChange={(selected) => {
                  setNextUsers(selected as SelectOption[]);
                }}
                value={nextUsers}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Flow Mapping
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
