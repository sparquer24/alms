"use client";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useRouter } from "next/navigation";

const mockLocations = ["HQ", "District 1", "District 2", "District 3"];
const mockMappings = [
  { source: "HQ", targets: ["District 1", "District 2"] },
  { source: "District 1", targets: ["District 3"] },
];

export default function ForwardingPage() {
  const { isLoggedIn } = useAdminAuth();
  const router = useRouter();
  const [source, setSource] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [mappings, setMappings] = useState(mockMappings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn) router.push("/admin/login");
    setLocations(mockLocations);
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/admin/forwarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, targets }),
    });
    if (res.ok) {
      setMappings([...mappings, { source, targets }]);
      setMessage("Mapping added!");
      setSource("");
      setTargets([]);
    } else {
      setMessage("Failed to add mapping.");
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setTargets(selected);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6 text-[#001F54]">Location Forwarding Master Data</h1>
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-[#001F54]">Source Location</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#001F54] focus:border-[#001F54]" value={source} onChange={e => setSource(e.target.value)} required>
              <option value="" disabled>Select source</option>
              {locations.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-[#001F54]">Target Locations</label>
            <select
              multiple
              className="w-full border border-gray-300 rounded px-3 py-2 h-32 focus:ring-2 focus:ring-[#001F54] focus:border-[#001F54]"
              value={targets}
              onChange={handleTargetChange}
              required
            >
              {locations.filter(l => l !== source).map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          {message && <div className="mb-2 text-green-700 font-medium">{message}</div>}
          <button type="submit" className="w-full bg-[#001F54] text-white py-2 rounded font-semibold hover:bg-[#112a61] transition">Save Mapping</button>
        </form>
        <h2 className="text-lg font-bold mb-4 text-[#001F54]">Existing Mappings</h2>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-[#f4f7fb] text-[#001F54]">
              <th className="border px-2 py-2 font-semibold">Source</th>
              <th className="border px-2 py-2 font-semibold">Targets</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m, i) => (
              <tr key={i} className="hover:bg-[#f0f4fa]">
                <td className="border px-2 py-2">{m.source}</td>
                <td className="border px-2 py-2">{m.targets.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
