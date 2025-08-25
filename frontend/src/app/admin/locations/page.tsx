"use client";
import { useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useRouter } from "next/navigation";

export default function AddLocationPage() {
  const { isLoggedIn } = useAdminAuth();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  if (!isLoggedIn) {
    router.replace("/admin/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });
    if (res.ok) {
      setMessage("Location added successfully!");
      setLocation("");
    } else {
      setMessage("Failed to add location.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Add Location</h1>
        <div className="mb-4">
          <label className="block mb-1">Location Name</label>
          <input className="w-full border rounded px-3 py-2" value={location} onChange={e => setLocation(e.target.value)} required />
        </div>
        {message && <div className="mb-2 text-green-600">{message}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Location</button>
      </form>
    </div>
  );
}
