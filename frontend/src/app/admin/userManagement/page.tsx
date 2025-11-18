"use client";

import { Sidebar } from "../../../components/Sidebar";
import { useState, useMemo, useRef, useEffect } from "react";
import { useAuthSync } from "../../../hooks/useAuthSync";
import Papa from "papaparse";
import * as XLSX from 'xlsx';
import { fetchData, postData, putData, deleteData } from "../../../api/axiosConfig";

// Types representing API user + transformed UI user
interface ApiRole {
	id: number;
	code: string;
	name?: string;
	is_active?: boolean;
	created_at?: string;
	updated_at?: string;
	dashboard_title?: string;
	menu_items?: any;
	permissions?: any;
	can_access_settings?: boolean;
	can_forward?: boolean;
	can_re_enquiry?: boolean;
	can_generate_ground_report?: boolean;
	can_FLAF?: boolean;
	can_create_freshLicence?: boolean;
}
interface ApiUser {
	id: number | string;
	username: string;
	email?: string;
	phoneNo?: string;
	role?: ApiRole;
	createdAt?: string;
	updatedAt?: string;
}
interface UiUser {
	id: number;
	username: string;
	role: string; // role code
	email: string;
	phoneNo: string; // retained in data model but not shown in table
	createdAt?: string;
	updatedAt?: string;
	roleName?: string;
	roleFull?: ApiRole; // full role object for details modal
}

export default function UserManagementPage() {
	const [users, setUsers] = useState<UiUser[]>([]);
	const [apiRoles, setApiRoles] = useState<ApiRole[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showBulkModal, setShowBulkModal] = useState(false);
	const [downloadLoading, setDownloadLoading] = useState(false);
	const [addUser, setAddUser] = useState({
		username: "",
		password: "",
		roleCode: "",
		email: "",
		phoneNo: "",
	});
	const [addError, setAddError] = useState("");
	const [bulkError, setBulkError] = useState("");
	const [bulkUsers, setBulkUsers] = useState<any[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [detailsUser, setDetailsUser] = useState<UiUser | null>(null);
	const [detailsEditMode, setDetailsEditMode] = useState(false);
	const [detailsMessage, setDetailsMessage] = useState<string>("");
	const [detailsSaving, setDetailsSaving] = useState(false);
	const [detailsForm, setDetailsForm] = useState<{ username: string; email: string; phoneNo: string; roleCode: string }>({ username: "", email: "", phoneNo: "", roleCode: "" });
	const [editUser, setEditUser] = useState<UiUser | null>(null);
	const [editLoading, setEditLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<UiUser | null>(null);
	const [actionMessage, setActionMessage] = useState<string>("");
	const { userRole } = useAuthSync();
	const isAdmin = (userRole || "").toUpperCase() === "ADMIN";

	// Fetch users
	const loadUsers = async () => {
		setLoading(true);
		setError("");
		try {
			const params: any = {};
			if (roleFilter) params.role = roleFilter;
			const data = await fetchData("/users", params);
			const list: ApiUser[] = Array.isArray(data) ? data : data?.data || data?.users || [];
			const ui: UiUser[] = list.map(u => ({
				id: Number(u.id),
				username: u.username,
				role: u.role?.code || "",
				email: u.email || "",
				phoneNo: (u as any).phoneNo || (u as any).phone || "",
				createdAt: (u as any).createdAt,
				updatedAt: (u as any).updatedAt,
				roleName: (u as any).role?.name,
				roleFull: u.role,
			}));
			setUsers(ui);
			const unique: Record<string, ApiRole> = {};
			list.forEach(u => { if (u.role?.code && !unique[u.role.code]) unique[u.role.code] = u.role; });
			const rolesArr = Object.values(unique);
			setApiRoles(rolesArr);
			setAddUser(prev => ({ ...prev, roleCode: prev.roleCode || rolesArr[0]?.code || "" }));
		} catch (e: any) {
			setError(e.message || "Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadUsers(); }, [roleFilter]);

	const openDetails = (u: UiUser) => {
		setDetailsUser(u);
		setDetailsEditMode(false);
		setDetailsMessage("");
		setDetailsSaving(false);
		setDetailsForm({
			username: u.username || "",
			email: u.email || "",
			phoneNo: u.phoneNo || "",
			roleCode: u.role || "",
		});
	};

	const handleDetailsSave = async () => {
		if (!detailsUser) return;
		setDetailsSaving(true);
		setDetailsMessage("");
		try {
			const role = apiRoles.find(r => r.code === detailsForm.roleCode);
			await putData(`/users/${detailsUser.id}`, {
				username: detailsForm.username,
				email: detailsForm.email || undefined,
				phoneNo: detailsForm.phoneNo || undefined,
				roleId: role?.id,
			});
			// Optimistically update UI
			const updated: UiUser = {
				...detailsUser,
				username: detailsForm.username,
				email: detailsForm.email,
				phoneNo: detailsForm.phoneNo,
				role: detailsForm.roleCode,
				roleName: role?.name || detailsUser.roleName,
				// keep roleFull as-is; refreshed below
			};
			setDetailsUser(updated);
			setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
			// Refresh to fetch latest roleFull
			await loadUsers();
			setDetailsMessage("Saved successfully");
			setDetailsEditMode(false);
		} catch (e: any) {
			setDetailsMessage(e.message || "Failed to save changes");
		} finally {
			setDetailsSaving(false);
		}
	};

	const filteredUsers = useMemo(() => {
		return users.filter(u => {
			const term = search.toLowerCase();
			const match = u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.phoneNo.toLowerCase().includes(term);
			const matchesRole = roleFilter ? u.role === roleFilter : true;
			return match && matchesRole;
		});
	}, [users, search, roleFilter]);

	const validateUser = (user: any) => {
		if (!user.username || !user.password || !user.roleCode) return "Username, Password & Role are required.";
		if (user.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) return "Invalid email.";
		return "";
	};

	const handleAddUser = async () => {
		const err = validateUser(addUser);
		if (err) return setAddError(err);
		const role = apiRoles.find(r => r.code === addUser.roleCode);
		if (!role) return setAddError("Role list not loaded.");
		try {
			await postData("/users", { username: addUser.username, password: addUser.password, roleId: role.id, email: addUser.email || undefined, phoneNo: addUser.phoneNo || undefined });
			setShowAddModal(false);
			setAddUser({ username: "", password: "", roleCode: apiRoles[0]?.code || "", email: "", phoneNo: "" });
			setAddError("");
			await loadUsers();
		} catch (e: any) {
			setAddError(e.message || "Failed to create user");
		}
	};

	const handleBulkFile = (file: File) => {
		setBulkError("");
		Papa.parse(file, { header: true, complete: (results: any) => { const parsed = (results.data || []).filter((u: any) => u.username && (u.role || u.roleCode)); setBulkUsers(parsed); }, error: () => setBulkError("Failed to parse file.") });
	};

	const handleBulkAdd = async () => {
		if (!bulkUsers.length) return;
		for (const u of bulkUsers) {
			try {
				const role = apiRoles.find(r => r.code === (u.roleCode || u.role));
				if (!role) continue;
				await postData("/users", { username: u.username, password: u.password || "Password123!", roleId: role.id, email: u.email || undefined, phoneNo: u.phoneNo || u.phone || undefined });
			} catch (e) { }
		}
		setShowBulkModal(false);
		setBulkUsers([]);
		await loadUsers();
	};

	const handleDownloadAll = async () => {
		setDownloadLoading(true);
		setError("");
		try {
			// Fetch full user list (ignore current roleFilter to get all users)
			const data = await fetchData('/users', {});
			const list: ApiUser[] = Array.isArray(data) ? data : data?.data || data?.users || [];

			const rows = list.map(u => ({
				id: u.id,
				username: u.username,
				role: (u.role && (u.role.code ?? (typeof u.role === 'string' ? u.role : ''))) || (u as any).roleCode || '',
				roleName: u.role?.name || '',
				email: u.email || '',
				phoneNo: (u as any).phoneNo || (u as any).phone || '',
				createdAt: (u as any).createdAt || (u as any).created_at || '',
				updatedAt: (u as any).updatedAt || (u as any).updated_at || '',
			}));

			// Build worksheet and workbook using SheetJS (xlsx)
			const worksheet = XLSX.utils.json_to_sheet(rows);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

			// Write workbook to binary array and trigger download
			const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
			const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `alms-users-${new Date().toISOString().slice(0,10)}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (e: any) {
			setError(e?.message || 'Failed to download users');
		} finally {
			setDownloadLoading(false);
		}
	};

	const openEdit = (u: UiUser) => {
		setEditUser({ ...u });
		setActionMessage("");
	};

	const saveEdit = async () => {
		if (!editUser) return;
		setEditLoading(true);
		setActionMessage("");
		try {
			// find roleId from code
			const role = apiRoles.find(r => r.code === editUser.role);
			await putData(`/users/${editUser.id}`, {
				username: editUser.username,
				email: editUser.email || undefined,
				phoneNo: editUser.phoneNo || undefined,
				roleId: role?.id,
			});
			setActionMessage("Updated successfully");
			setTimeout(() => setEditUser(null), 600);
			await loadUsers();
		} catch (e: any) {
			setActionMessage(e.message || "Update failed");
		} finally {
			setEditLoading(false);
		}
	};

	const confirmDelete = (u: UiUser) => { setDeleteTarget(u); setActionMessage(""); };
	const doDelete = async () => {
		if (!deleteTarget) return;
		setEditLoading(true);
		try { await deleteData(`/users/${deleteTarget.id}`); setActionMessage("Deleted"); setTimeout(() => setDeleteTarget(null), 500); await loadUsers(); } catch (e: any) { setActionMessage(e.message || "Delete failed"); } finally { setEditLoading(false); }
	};

	const skeletonRows = Array.from({ length: 6 });

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
			<Sidebar />
			<div className="flex-1 p-4 md:p-8">
				<div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
					{/* Header Section */}
					<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
						<div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
							<div className="text-white">
								<h1 className="text-3xl font-bold mb-2">User Management</h1>
								<p className="text-blue-100 text-lg">Manage platform users, assign roles, and onboard in bulk</p>
							</div>
						</div>
						<div className="p-6 bg-white">
							<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
								<div className="flex flex-col sm:flex-row gap-3 flex-1">
									<div className="relative flex-1 max-w-md">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
										</div>
										<input
											className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
											placeholder="Search username, email, or phone..."
											value={search}
											onChange={e => setSearch(e.target.value)}
										/>
									</div>
									<select
										value={roleFilter}
										onChange={e => setRoleFilter(e.target.value)}
										className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[160px]"
									>
										<option value="">All Roles</option>
										{apiRoles.map(r => (
											<option key={r.code} value={r.code}>{r.code}</option>
										))}
									</select>
								</div>
								<div className="flex gap-3">
									<button
										onClick={handleDownloadAll}
										disabled={downloadLoading}
										className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:opacity-50"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4v6a2 2 0 002 2h6a2 2 0 002-2v-6h4M12 3v13" />
										</svg>
										<span>{downloadLoading ? 'Preparing…' : 'Download Excel'}</span>
									</button>
									<button
										onClick={() => setShowAddModal(true)}
										className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
										Add User
									</button>
									<button
										onClick={() => setShowBulkModal(true)}
										className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
										</svg>
										Bulk Upload
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Error Alert */}
					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm flex items-start gap-3">
							<div className="flex-shrink-0">
								<svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
								</svg>
							</div>
							<div>
								<h3 className="text-sm font-medium text-red-800">Error loading users</h3>
								<p className="text-sm text-red-600 mt-1">{error}</p>
							</div>
						</div>
					)}

					{/* Users Table */}
					<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
						<div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-slate-800">Users</h2>
								<span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
									{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
								</span>
							</div>
						</div>
							<div className="overflow-x-auto">
								{/* Keep table header fixed while rows scroll - wrap table in a scrollable container */}
								<div className="max-h-[60vh] overflow-y-auto">
								<table className="w-full table-fixed">
										<thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
									<tr>
										<th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
										<th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
										<th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
										<th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
										<th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{loading && skeletonRows.map((_, i) => (
										<tr key={i} className="animate-pulse">
											<td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded"></div></td>
											<td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-3/4"></div></td>
											<td className="py-4 px-4"><div className="h-6 bg-slate-200 rounded w-20"></div></td>
											<td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
											<td className="py-4 px-4"><div className="h-8 bg-slate-200 rounded w-16"></div></td>
										</tr>
									))}
									{!loading && filteredUsers.length === 0 && (
										<tr>
											<td colSpan={5} className="py-12 text-center">
												<div className="flex flex-col items-center justify-center text-slate-400">
													<svg className="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
													</svg>
													<p className="text-lg font-medium">No users found</p>
													<p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
												</div>
											</td>
										</tr>
									)}
									{!loading && filteredUsers.map((u, idx) => (
										<tr key={u.id} className="hover:bg-slate-50 transition-colors">
											<td className="py-4 px-4 text-sm text-slate-500 font-medium">{idx + 1}</td>
											<td className="py-4 px-4">
												<div>
													<div className="font-medium text-slate-900">{u.username}</div>
													<div className="text-xs text-slate-500 font-mono mt-1">ID: {u.id}</div>
												</div>
											</td>
											<td className="py-4 px-4">
												{u.role ? (
													<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
														{u.role}
													</span>
												) : <span className="text-slate-400 text-sm">-</span>}
											</td>
											<td className="py-4 px-4">
												<div className="space-y-1">
													{u.email && <div className="text-sm text-slate-700 flex items-center gap-2">
														<svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
														</svg>
														{u.email}
													</div>}
													{u.phoneNo && <div className="text-sm text-slate-700 flex items-center gap-2">
														<svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
														</svg>
														{u.phoneNo}
													</div>}
												</div>
											</td>
											<td className="py-4 px-4 w-36">
												<div className="flex gap-2 justify-end">
													<button
														onClick={() => openDetails(u)}
														className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white w-9 h-9 text-slate-600 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
														title="View details"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
													</button>
													<button 
														onClick={() => openEdit(u)} 
														className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 w-9 h-9 text-amber-600 hover:bg-amber-100 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
														title="Edit user"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>
													<button 
														onClick={() => confirmDelete(u)} 
														className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-red-50 w-9 h-9 text-red-600 hover:bg-red-100 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
														title="Delete user"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Add User Modal */}
			{showAddModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setAddError(""); }} />
					<div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-slate-800">Add New User</h2>
							<button onClick={() => { setShowAddModal(false); setAddError(""); }} className="text-slate-400 hover:text-slate-600">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
								<input 
									className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
									placeholder="Enter username" 
									value={addUser.username} 
									onChange={e => setAddUser({ ...addUser, username: e.target.value })} 
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
								<input 
									type="password" 
									className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
									placeholder="Enter password" 
									value={addUser.password} 
									onChange={e => setAddUser({ ...addUser, password: e.target.value })} 
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
								<select 
									className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
									value={addUser.roleCode} 
									onChange={e => setAddUser({ ...addUser, roleCode: e.target.value })}
								>
									<option value="">Select a role</option>
									{apiRoles.map(r => <option key={r.code} value={r.code}>{r.code} {r.name ? `- ${r.name}` : ''}</option>)}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
								<input 
									className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
									placeholder="Enter email" 
									value={addUser.email} 
									onChange={e => setAddUser({ ...addUser, email: e.target.value })} 
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Phone (Optional)</label>
								<input 
									className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" 
									placeholder="Enter phone number" 
									value={addUser.phoneNo} 
									onChange={e => setAddUser({ ...addUser, phoneNo: e.target.value })} 
								/>
							</div>
							{addError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{addError}</div>}
							<div className="flex gap-3 justify-end pt-2">
								<button 
									className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300" 
									onClick={() => { setShowAddModal(false); setAddError(""); }}
								>
									Cancel
								</button>
								<button 
									className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300" 
									onClick={handleAddUser}
								>
									Add User
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Bulk Upload Modal */}
			{showBulkModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowBulkModal(false); setBulkError(""); setBulkUsers([]); }} />
					<div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-slate-800">Bulk Upload Users</h2>
							<button onClick={() => { setShowBulkModal(false); setBulkError(""); setBulkUsers([]); }} className="text-slate-400 hover:text-slate-600">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="space-y-4">
							<div className="text-sm text-slate-600">
								<p>Upload a CSV file with columns: <span className="font-mono bg-slate-100 px-1 rounded">username</span>, <span className="font-mono bg-slate-100 px-1 rounded">password</span>, <span className="font-mono bg-slate-100 px-1 rounded">role</span>, <span className="font-mono bg-slate-100 px-1 rounded">email</span>, <span className="font-mono bg-slate-100 px-1 rounded">phoneNo</span></p>
							</div>
							<div
								className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
								onClick={() => fileInputRef.current?.click()}
								onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleBulkFile(e.dataTransfer.files[0]); }}
								onDragOver={e => e.preventDefault()}
							>
								<svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
								<p className="mb-1">Drag & drop CSV file here</p>
								<p className="text-sm text-slate-500">or <span className="text-blue-600 font-medium">browse files</span></p>
								<input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={e => { if (e.target.files?.[0]) handleBulkFile(e.target.files[0]); }} />
							</div>
							{bulkError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{bulkError}</div>}
							{bulkUsers.length > 0 && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{bulkUsers.length} users ready for import</div>}
							<div className="flex gap-3 justify-end pt-2">
								<button 
									className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300" 
									onClick={() => { setShowBulkModal(false); setBulkError(""); setBulkUsers([]); }}
								>
									Cancel
								</button>
								<button 
									disabled={!bulkUsers.length} 
									className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed" 
									onClick={handleBulkAdd}
								>
									Import Users
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Details Modal */}
			{detailsUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDetailsUser(null)} />
					<div className="relative w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-xl max-h-[90vh] overflow-hidden">
						<div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
							<h2 className="text-xl font-semibold flex items-center gap-3">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								User Details
							</h2>
							<div className="flex items-center gap-2">
								{isAdmin && (
									<button
										onClick={() => { setDetailsEditMode((e) => !e); setDetailsMessage(""); }}
										className={`rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm border transition-colors ${detailsEditMode ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
									>
										{detailsEditMode ? 'Cancel Edit' : 'Edit'}
									</button>
								)}
								<button onClick={() => setDetailsUser(null)} className="rounded-lg bg-white/10 hover:bg-white/20 w-8 h-8 flex items-center justify-center transition-colors">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						<div className="overflow-y-auto max-h-[calc(90vh-80px)]">
							{detailsMessage && (
								<div className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm ${/fail|error/i.test(detailsMessage) ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
									{detailsMessage}
								</div>
							)}
							<div className="p-6">
								<div className="grid md:grid-cols-2 gap-6">
									<div className="space-y-6">
										<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
											<h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">User Information</h3>
											<dl className="space-y-3">
												<div>
													<dt className="text-xs text-slate-500 font-medium">User ID</dt>
													<dd className="text-sm font-mono text-slate-700">{detailsUser.id}</dd>
												</div>
												{!detailsEditMode ? (
													<>
														<div>
															<dt className="text-xs text-slate-500 font-medium">Username</dt>
															<dd className="text-sm font-medium text-slate-900">{detailsUser.username}</dd>
														</div>
														<div>
															<dt className="text-xs text-slate-500 font-medium">Email</dt>
															<dd className="text-sm text-slate-700">{detailsUser.email || <span className="text-slate-400">Not provided</span>}</dd>
														</div>
														<div>
															<dt className="text-xs text-slate-500 font-medium">Phone</dt>
															<dd className="text-sm text-slate-700">{detailsUser.phoneNo || <span className="text-slate-400">Not provided</span>}</dd>
														</div>
													</>
												) : (
													<>
														<div>
															<label className="text-xs text-slate-500 font-medium block mb-1">Username</label>
															<input value={detailsForm.username} onChange={e => setDetailsForm(s => ({ ...s, username: e.target.value }))} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
														</div>
														<div>
															<label className="text-xs text-slate-500 font-medium block mb-1">Email</label>
															<input value={detailsForm.email} onChange={e => setDetailsForm(s => ({ ...s, email: e.target.value }))} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
														</div>
														<div>
															<label className="text-xs text-slate-500 font-medium block mb-1">Phone</label>
															<input value={detailsForm.phoneNo} onChange={e => setDetailsForm(s => ({ ...s, phoneNo: e.target.value }))} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
														</div>
													</>
												)}
											</dl>
										</div>
										<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
											<h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Timestamps</h3>
											<dl className="space-y-2">
												<div>
													<dt className="text-xs text-slate-500 font-medium">Created</dt>
													<dd className="text-sm text-slate-700">{detailsUser.createdAt ? new Date(detailsUser.createdAt).toLocaleString() : '-'}</dd>
												</div>
												<div>
													<dt className="text-xs text-slate-500 font-medium">Last Updated</dt>
													<dd className="text-sm text-slate-700">{detailsUser.updatedAt ? new Date(detailsUser.updatedAt).toLocaleString() : '-'}</dd>
												</div>
											</dl>
										</div>
									</div>
									<div className="space-y-6">
										<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
											<h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Role Information</h3>
											<dl className="space-y-3">
												{!detailsEditMode ? (
													<>
														<div>
															<dt className="text-xs text-slate-500 font-medium">Role Code</dt>
															<dd className="text-sm font-medium text-blue-700">{detailsUser.role || '-'}</dd>
														</div>
														<div>
															<dt className="text-xs text-slate-500 font-medium">Role Name</dt>
															<dd className="text-sm text-slate-700">{detailsUser.roleName || '-'}</dd>
														</div>
													</>
												) : (
													<div>
														<label className="text-xs text-slate-500 font-medium block mb-1">Role</label>
														<select value={detailsForm.roleCode} onChange={e => setDetailsForm(s => ({ ...s, roleCode: e.target.value }))} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
															{apiRoles.map(r => <option key={r.code} value={r.code}>{r.code} {r.name ? `- ${r.name}` : ''}</option>)}
														</select>
													</div>
												)}
												{detailsUser.roleFull && (
													<>
														<div>
															<dt className="text-xs text-slate-500 font-medium">Status</dt>
															<dd className="text-sm">
																<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${detailsUser.roleFull.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
																	{detailsUser.roleFull.is_active ? 'Active' : 'Inactive'}
																</span>
															</dd>
														</div>
														<div>
															<dt className="text-xs text-slate-500 font-medium">Dashboard Title</dt>
															<dd className="text-sm text-slate-700">{detailsUser.roleFull.dashboard_title || '-'}</dd>
														</div>
													</>
												)}
											</dl>
										</div>
										{detailsUser.roleFull && (
											<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
												<h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Permissions</h3>
												<div className="flex flex-wrap gap-2">
													{[
														['Settings', detailsUser.roleFull.can_access_settings],
														['Forward', detailsUser.roleFull.can_forward],
														['Re-Enquiry', detailsUser.roleFull.can_re_enquiry],
														['Ground Report', detailsUser.roleFull.can_generate_ground_report],
														['FLAF', detailsUser.roleFull.can_FLAF],
														['Create Fresh Licence', detailsUser.roleFull.can_create_freshLicence],
													].map(([label, enabled]) => (
														<span key={label as string} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${enabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
															{label as string}
														</span>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
								<div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-200">
									<button onClick={() => setDetailsUser(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
										Close
									</button>
									{isAdmin && detailsEditMode && (
										<button disabled={detailsSaving} onClick={handleDetailsSave} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60">
											{detailsSaving ? 'Saving…' : 'Save Changes'}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Edit Modal */}
			{editUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditUser(null)} />
					<div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-slate-800">Edit User</h2>
							<button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
								<input value={editUser.username} onChange={e => setEditUser({ ...editUser, username: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
								<input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
								<input value={editUser.phoneNo} onChange={e => setEditUser({ ...editUser, phoneNo: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
							</div>
							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
								<select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
									{apiRoles.map(r => <option key={r.code} value={r.code}>{r.code}</option>)}
								</select>
							</div>
							{actionMessage && <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">{actionMessage}</div>}
							<div className="flex justify-end gap-3 pt-2">
								<button disabled={editLoading} onClick={() => setEditUser(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">Cancel</button>
								<button disabled={editLoading} onClick={saveEdit} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50">{editLoading ? 'Saving...' : 'Save Changes'}</button>
							</div>
						</div>
					</div>
				</div>
			)}

		{/* Delete Confirmation */}
		{deleteTarget && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
				<div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
							<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<div>
							<h2 className="text-lg font-semibold text-slate-800">Delete User</h2>
							<p className="text-sm text-slate-600">This action cannot be undone</p>
						</div>
					</div>
					<p className="text-sm text-slate-700 mb-4">Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.username}</span>? All associated data will be permanently removed.</p>
					{actionMessage && <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 mb-4">{actionMessage}</div>}
					<div className="flex justify-end gap-3">
						<button disabled={editLoading} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">Cancel</button>
						<button disabled={editLoading} onClick={doDelete} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50">{editLoading ? 'Deleting...' : 'Delete User'}</button>
					</div>
				</div>
			</div>
		)}
		</div>
	);
}