"use client";

import { Sidebar } from "../../../components/Sidebar";
import { useState, useMemo, useRef } from "react";
import Papa from "papaparse";

// Mock user data
const mockUsers = [
	{
		id: 1,
		name: "Alice",
		role: "ZS",
		office: "Office A",
		email: "alice@example.com",
		phone: "1234567890",
	},
	{
		id: 2,
		name: "Bob",
		role: "DCP",
		office: "Office B",
		email: "bob@example.com",
		phone: "2345678901",
	},
	{
		id: 3,
		name: "Charlie",
		role: "SHO",
		office: "Office C",
		email: "charlie@example.com",
		phone: "3456789012",
	},
];

const roles = ["ZS", "DCP", "SHO", "ADMIN"];

// Mock application data
const mockApplications = [
	{ id: 1, state: "pending", createdAt: "2025-06-01", assignedRole: "ZS" },
	{ id: 2, state: "approved", createdAt: "2025-06-02", assignedRole: "DCP" },
	{ id: 3, state: "pending", createdAt: "2025-06-08", assignedRole: "ZS" },
	{ id: 4, state: "rejected", createdAt: "2025-06-10", assignedRole: "SHO" },
	{ id: 5, state: "approved", createdAt: "2025-06-15", assignedRole: "DCP" },
	{ id: 6, state: "pending", createdAt: "2025-06-15", assignedRole: "ZS" },
	{ id: 7, state: "approved", createdAt: "2025-06-22", assignedRole: "SHO" },
];

const applicationStates = ["pending", "approved", "rejected"];

// Mock recent admin activities
const mockAdminActivities = [
	{
		id: 1,
		user: "ZS123",
		action: "forwarded application #15 to ACP",
		time: "2025-06-28 10:15",
	},
	{
		id: 2,
		user: "DCP456",
		action: "approved application #12",
		time: "2025-06-28 09:50",
	},
	{
		id: 3,
		user: "SHO789",
		action: "rejected application #9",
		time: "2025-06-27 17:30",
	},
	{ id: 4, user: "ADMIN", action: "created user Bob", time: "2025-06-27 16:00" },
];

export default function UserManagementPage() {
	const [users, setUsers] = useState(mockUsers);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [editId, setEditId] = useState<number | null>(null);
	const [editUser, setEditUser] = useState<any>(null);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showBulkModal, setShowBulkModal] = useState(false);
	const [addUser, setAddUser] = useState({
		name: "",
		role: roles[0],
		office: "",
		email: "",
		phone: "",
	});
	const [addError, setAddError] = useState("");
	const [bulkError, setBulkError] = useState("");
	const [bulkUsers, setBulkUsers] = useState<any[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Calculate user counts per role (for possible use in analytics)
	const userCountsByRole = useMemo(() => {
		const counts: Record<string, number> = {};
		users.forEach((u) => {
			counts[u.role] = (counts[u.role] || 0) + 1;
		});
		return counts;
	}, [users]);

	// Filtered users based on search and role
	const filteredUsers = useMemo(() => {
		return users.filter((u) => {
			const matchesSearch =
				u.name.toLowerCase().includes(search.toLowerCase()) ||
				u.email.toLowerCase().includes(search.toLowerCase()) ||
				u.office.toLowerCase().includes(search.toLowerCase());
			const matchesRole = roleFilter ? u.role === roleFilter : true;
			return matchesSearch && matchesRole;
		});
	}, [users, search, roleFilter]);

	const handleDelete = (id: number) => {
		setUsers(users.filter((u) => u.id !== id));
		setDeleteId(null);
	};

	const handleEdit = (user: any) => {
		setEditId(user.id);
		setEditUser({ ...user });
	};

	const handleEditChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		setEditUser({ ...editUser, [e.target.name]: e.target.value });
	};

	const handleEditSave = () => {
		setUsers(
			users.map((u) => (u.id === editId ? { ...editUser, id: editId } : u))
		);
		setEditId(null);
		setEditUser(null);
	};

	const handleEditCancel = () => {
		setEditId(null);
		setEditUser(null);
	};

	// Add user validation
	const validateUser = (user: any) => {
		if (!user.name || !user.role || !user.office || !user.email || !user.phone)
			return "All fields are required.";
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email))
			return "Invalid email format.";
		if (users.some((u) => u.email === user.email || u.phone === user.phone))
			return "Duplicate email or phone.";
		return "";
	};

	const handleAddUser = () => {
		const err = validateUser(addUser);
		if (err) {
			setAddError(err);
			return;
		}
		setUsers([...users, { ...addUser, id: Date.now() }]);
		setShowAddModal(false);
		setAddUser({
			name: "",
			role: roles[0],
			office: "",
			email: "",
			phone: "",
		});
		setAddError("");
	};

	// Bulk upload handlers
	const handleBulkFile = (file: File) => {
		setBulkError("");
		Papa.parse(file, {
			header: true,
			complete: (results: any) => {
				const parsed = results.data.filter(
					(u: any) => u.name && u.role && u.office && u.email && u.phone
				);
				const errors = parsed.map(validateUser).filter(Boolean);
				if (errors.length) {
					setBulkError("Some users have errors. Please check your file.");
					setBulkUsers([]);
				} else {
					setBulkUsers(parsed);
				}
			},
			error: () => setBulkError("Failed to parse file."),
		});
	};

	const handleBulkAdd = () => {
		setUsers([
			...users,
			...bulkUsers.map((u) => ({ ...u, id: Date.now() + Math.random() })),
		]);
		setShowBulkModal(false);
		setBulkUsers([]);
		setBulkError("");
	};

	return (
		<div className="flex">
			<Sidebar />
			<div className="flex-1 p-4">
				<div className="flex-1 flex flex-col min-h-screen">
					<main className="flex-1 flex flex-col items-center justify-start p-0 md:pt-6 md:pl-0 w-full">
						<h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-blue-900 w-full max-w-5xl md:max-w-6xl px-4 md:px-0">
							User Management
						</h1>
						{/* Add User & Bulk Upload Buttons */}
						<div className="flex gap-3 mb-4 w-full max-w-5xl md:max-w-6xl justify-end">
							<button
								className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
								onClick={() => setShowAddModal(true)}
							>
								Add User
							</button>
							<button
								className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
								onClick={() => setShowBulkModal(true)}
							>
								Bulk Upload
							</button>
						</div>
						{/* User search and filter controls */}
						<div className="flex flex-col md:flex-row gap-3 mb-4 w-full max-w-5xl md:max-w-6xl">
							<input
								type="text"
								placeholder="Search by name, email, or office..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="flex-1 border rounded-lg px-3 py-2 text-base"
							/>
							<select
								value={roleFilter}
								onChange={(e) => setRoleFilter(e.target.value)}
								className="border rounded-lg px-3 py-2 text-base min-w-[140px]"
							>
								<option value="">All Roles</option>
								{roles.map((role) => (
									<option key={role} value={role}>
										{role}
									</option>
								))}
							</select>
						</div>
						<div className="bg-white rounded-lg shadow p-6 w-full max-w-5xl md:max-w-6xl">
							<table className="w-full text-base mb-4 border-separate border-spacing-y-3">
								<thead>
									<tr className="bg-gray-100 text-gray-800 rounded-2xl">
										<th className="py-4 px-4 text-left rounded-tl-2xl">Name</th>
										<th className="py-4 px-4 text-left">Role</th>
										<th className="py-4 px-4 text-left">Office</th>
										<th className="py-4 px-4 text-left">Email</th>
										<th className="py-4 px-4 text-left">Phone</th>
										<th className="py-4 px-4 text-left rounded-tr-2xl">Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredUsers.map((user, index) => (
										<tr
											key={user.id}
											className="bg-white shadow-md rounded-2xl hover:shadow-lg transition-all"
										>
											{editId === user.id ? (
												<>
													<td className="py-3 px-4">
														<input
															className="border rounded-lg px-3 py-2 w-full"
															name="name"
															value={editUser.name}
															onChange={handleEditChange}
														/>
													</td>
													<td className="py-3 px-4">
														<select
															className="border rounded-lg px-3 py-2 w-full"
															name="role"
															value={editUser.role}
															onChange={handleEditChange}
														>
															{roles.map((r) => (
																<option key={r} value={r}>
																	{r}
																</option>
															))}
														</select>
													</td>
													<td className="py-3 px-4">
														<input
															className="border rounded-lg px-3 py-2 w-full"
															name="office"
															value={editUser.office}
															onChange={handleEditChange}
														/>
													</td>
													<td className="py-3 px-4">
														<input
															className="border rounded-lg px-3 py-2 w-full"
															name="email"
															value={editUser.email}
															onChange={handleEditChange}
														/>
													</td>
													<td className="py-3 px-4">
														<input
															className="border rounded-lg px-3 py-2 w-full"
															name="phone"
															value={editUser.phone}
															onChange={handleEditChange}
														/>
													</td>
													<td className="py-3 px-4 flex gap-2">
														<button
															className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-semibold"
															onClick={handleEditSave}
														>
															Save
														</button>
														<button
															className="px-4 py-2 bg-gray-300 rounded-lg text-sm font-semibold"
															onClick={handleEditCancel}
														>
															Cancel
														</button>
													</td>
												</>
											) : (
												<>
													<td className="py-3 px-4 font-medium text-gray-800">
														{user.name}
													</td>
													<td className="py-3 px-4">{user.role}</td>
													<td className="py-3 px-4">{user.office}</td>
													<td className="py-3 px-4">{user.email}</td>
													<td className="py-3 px-4">{user.phone}</td>
													<td className="py-3 px-4 flex gap-2">
														<button
															className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 text-sm font-semibold"
															onClick={() => handleEdit(user)}
														>
															Edit
														</button>
														<button
															className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold"
															onClick={() => setDeleteId(user.id)}
														>
															Delete
														</button>
													</td>
												</>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{/* Delete confirmation modal */}
						{deleteId !== null && (
							<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
								<div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-sm">
									<p className="mb-6 text-lg text-gray-800">
										Are you sure you want to delete this user?
									</p>
									<div className="flex gap-4 justify-end">
										<button
											className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
											onClick={() => handleDelete(deleteId)}
										>
											Delete
										</button>
										<button
											className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold"
											onClick={() => setDeleteId(null)}
										>
											Cancel
										</button>
									</div>
								</div>
							</div>
						)}
						{/* Add User Modal */}
						{showAddModal && (
							<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
								<div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
									<h2 className="text-xl font-bold mb-4">Add User</h2>
									<div className="flex flex-col gap-3">
										<input
											className="border rounded-lg px-3 py-2"
											placeholder="Name"
											value={addUser.name}
											onChange={(e) =>
												setAddUser({ ...addUser, name: e.target.value })
											}
										/>
										<select
											className="border rounded-lg px-3 py-2"
											value={addUser.role}
											onChange={(e) =>
												setAddUser({ ...addUser, role: e.target.value })
											}
										>
											{roles.map((r) => (
												<option key={r} value={r}>
													{r}
												</option>
											))}
										</select>
										<input
											className="border rounded-lg px-3 py-2"
											placeholder="Office"
											value={addUser.office}
											onChange={(e) =>
												setAddUser({ ...addUser, office: e.target.value })
											}
										/>
										<input
											className="border rounded-lg px-3 py-2"
											placeholder="Email"
											value={addUser.email}
											onChange={(e) =>
												setAddUser({ ...addUser, email: e.target.value })
											}
										/>
										<input
											className="border rounded-lg px-3 py-2"
											placeholder="Phone"
											value={addUser.phone}
											onChange={(e) =>
												setAddUser({ ...addUser, phone: e.target.value })
											}
										/>
										{addError && (
											<div className="text-red-600 text-sm">{addError}</div>
										)}
										<div className="flex gap-3 justify-end mt-4">
											<button
												className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
												onClick={handleAddUser}
											>
												Add
											</button>
											<button
												className="px-4 py-2 bg-gray-300 rounded-lg font-semibold"
												onClick={() => {
													setShowAddModal(false);
													setAddError("");
												}}
											>
												Cancel
											</button>
										</div>
									</div>
								</div>
							</div>
						)}
						{/* Bulk Upload Modal */}
						{showBulkModal && (
							<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
								<div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
									<h2 className="text-xl font-bold mb-4">Bulk Upload Users</h2>
									<div className="flex flex-col gap-3 items-center">
										<div
											className="w-full border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
											onClick={() => fileInputRef.current?.click()}
											onDrop={(e) => {
												e.preventDefault();
												if (e.dataTransfer.files[0])
													handleBulkFile(e.dataTransfer.files[0]);
											}}
											onDragOver={(e) => e.preventDefault()}
										>
											Drag & drop CSV file here or{" "}
											<span className="text-blue-600 underline">browse</span>
											<input
												type="file"
												accept=".csv"
												ref={fileInputRef}
												className="hidden"
												onChange={(e) => {
													if (e.target.files?.[0])
														handleBulkFile(e.target.files[0]);
												}}
											/>
										</div>
										{bulkError && (
											<div className="text-red-600 text-sm">{bulkError}</div>
										)}
										{bulkUsers.length > 0 && (
											<div className="text-green-700 text-sm">
												{bulkUsers.length} users ready to add.
											</div>
										)}
										<div className="flex gap-3 justify-end mt-4 w-full">
											<button
												className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
												disabled={!bulkUsers.length}
												onClick={handleBulkAdd}
											>
												Add All
											</button>
											<button
												className="px-4 py-2 bg-gray-300 rounded-lg font-semibold"
												onClick={() => {
													setShowBulkModal(false);
													setBulkError("");
													setBulkUsers([]);
												}}
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
		</div>
	);
}
