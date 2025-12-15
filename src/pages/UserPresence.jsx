import React, { useEffect, useState, useRef } from "react";
import { Activity, Clock, DownloadCloud, RotateCw, Search, Users, Camera } from "lucide-react";

// UserPresenceReport.jsx
// - Stylish Tailwind UI for filtering and viewing user presence per camera
// - Calls report API when filters change (debounced)
// - Table shows user, start time, end time, time spent
// - CSV download (client-side)

export default function UserPresenceReport() {
	const [from, setFrom] = useState(""); // ISO-like "YYYY-MM-DDTHH:mm" from <input>
	const [to, setTo] = useState("");
	const [camNum, setCamNum] = useState("");
	const [userId, setUserId] = useState("");

	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const [cams, setCams] = useState([]);
	const [users, setUsers] = useState([]);

	const timerRef = useRef(null);
	const abortRef = useRef(null);

	// Helper: build query string from filters
	const buildQuery = () => {
		const params = new URLSearchParams();
		if (from) params.set("from", new Date(from).toISOString());
		if (to) params.set("to", new Date(to).toISOString());
		if (camNum) params.set("cam", camNum);
		if (userId) params.set("user", userId);
		return params.toString();
	};

	// Fetch report from backend
	const fetchReport = async (signal) => {
		setLoading(true);
		setError(null);
		try {
		const q = buildQuery();
		const url = `/api/reports/user-presence${q ? "?" + q : ""}`;
		const res = await fetch(url, { signal });
		if (!res.ok) throw new Error(`Server error: ${res.status}`);
		const json = await res.json();
		setData(Array.isArray(json) ? json : json.data || []);
		} catch (err) {
		if (err.name !== "AbortError") setError(err.message || "Failed to fetch");
		} finally {
		setLoading(false);
		}
	};

	// Debounced effect: call fetchReport when filters change
	useEffect(() => {
		// cancel existing timer
		if (timerRef.current) clearTimeout(timerRef.current);
		if (abortRef.current) abortRef.current.abort();

		// set up abort controller for fetch
		const ac = new AbortController();
		abortRef.current = ac;

		timerRef.current = setTimeout(() => {
		fetchReport(ac.signal);
		}, 350); // debounce 350ms

		return () => {
		clearTimeout(timerRef.current);
		ac.abort();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [from, to, camNum, userId]);

	// Fetch options for cams and users once
	useEffect(() => {
		let mounted = true;
		(async () => {
		try {
			const [camsRes, usersRes] = await Promise.all([
			fetch("/api/cameras"),
			fetch("/api/users"),
			]);
			if (!camsRes.ok || !usersRes.ok) return;
			const camsJson = await camsRes.json();
			const usersJson = await usersRes.json();
			if (!mounted) return;
			setCams(Array.isArray(camsJson) ? camsJson : camsJson.data || []);
			setUsers(Array.isArray(usersJson) ? usersJson : usersJson.data || []);
		} catch (e) {
			// ignore - optional
		}
		})();
		return () => (mounted = false);
	}, []);

	// Utility: format timestamp for display
	const formatTS = (iso) => {
		if (!iso) return "—";
		try {
		const d = new Date(iso);
		return d.toLocaleString();
		} catch (e) {
		return iso;
		}
	};

	// Utility: compute time spent between start and end
	const computeTimeSpent = (startIso, endIso, time_spent_seconds) => {
		if (time_spent_seconds != null) {
		// if backend provided seconds
		const s = Number(time_spent_seconds);
		if (isNaN(s)) return "—";
		const hrs = Math.floor(s / 3600);
		const mins = Math.floor((s % 3600) / 60);
		const secs = Math.floor(s % 60);
		return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
		}
		if (!startIso || !endIso) return "—";
		const diff = new Date(endIso) - new Date(startIso);
		if (isNaN(diff) || diff < 0) return "—";
		const s = Math.floor(diff / 1000);
		const hrs = Math.floor(s / 3600);
		const mins = Math.floor((s % 3600) / 60);
		const secs = Math.floor(s % 60);
		return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
	};

	// CSV generation and download (client-side)
	const downloadCSV = () => {
		if (!data || data.length === 0) return;
		const headers = ["user","cam_number","entry_time","exit_time","time_spent"];
		const rows = data.map((r) => {
		const timeSpent = computeTimeSpent(r.entry_time, r.exit_time, r.time_spent_seconds ?? r.time_spent);
		return [
			r.user_name ?? r.user ?? r.user_id ?? "",
			r.cam_number ?? r.cam ?? "",
			r.entry_time ?? "",
			r.exit_time ?? "",
			timeSpent,
		];
		});

		const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `user_presence_report_${new Date().toISOString()}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Activity className="w-6 h-6 text-yellow-400" />
					<div>
						<h2 className="text-2xl font-semibold">User Presence</h2>
						<p className="text-sm text-slate-500">Filter and export presence reports per camera</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => { setFrom(""); setTo(""); setCamNum(""); setUserId(""); }}
						className="flex items-center gap-2 px-3 py-2 bg-white border rounded shadow-sm text-sm text-black"
						title="Reset filters"
					>
						<RotateCw className="w-4 h-4" /> Reset
					</button>

					<button
						onClick={downloadCSV}
						className="ml-2 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded shadow-sm text-sm"
						title="Download CSV"
					>
						<DownloadCloud className="w-4 h-4" /> Export CSV
					</button>
				</div>
			</div>

			{/* Filters Card */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow">
				<div className="flex flex-col">
					<label className="text-sm font-medium text-slate-600 mb-1">From (timestamp)</label>
					<input
						type="datetime-local"
						value={from}
						onChange={(e) => setFrom(e.target.value)}
						className="px-3 py-2 border rounded text-slate-600"
					/>
				</div> 
				<div className="flex flex-col">
					<label className="text-sm font-medium text-slate-600 mb-1">To (timestamp)</label>
					<input
						type="datetime-local"
						value={to}
						onChange={(e) => setTo(e.target.value)}
						className="px-3 py-2 border rounded text-slate-600"
					/>
				</div>

				<div className="flex flex-col">
					<label className="text-sm font-medium text-slate-600 mb-1">Camera</label>
					<select value={camNum} onChange={(e) => setCamNum(e.target.value)} className="px-3 py-2 border rounded text-slate-600">
						<option value="">All cameras</option>
						{cams.map((c) => (
						<option key={c.id ?? c.number ?? c.cam_number} value={c.number ?? c.cam_number ?? c.id}>
							{c.name ?? `Camera ${c.number ?? c.cam_number ?? c.id}`}
						</option>
						))}
					</select>
				</div>

				<div className="flex flex-col">
					<label className="text-sm font-medium text-slate-600 mb-1">User</label>
					<select value={userId} onChange={(e) => setUserId(e.target.value)} className="px-3 py-2 border rounded text-slate-600">
						<option value="">All users</option>
						{users.map((u) => (
						<option key={u.id} value={u.id}>
							{u.name ?? u.username ?? u.email}
						</option>
						))}
					</select>
				</div>
			</div>

			{/* Table Card */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Search className="w-4 h-4 text-slate-500" />
						<h3 className="font-medium">Results</h3>
						<span className="text-sm text-slate-500">{loading ? "fetching..." : `${data.length} rows`}</span>
					</div> 
					<div className="text-sm text-red-500">{error}</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-slate-50">
						<tr>
							<th className="px-4 py-3 text-sm font-semibold text-slate-600">User</th>
							<th className="px-4 py-3 text-sm font-semibold text-slate-600">Camera</th>
							<th className="px-4 py-3 text-sm font-semibold text-slate-600">Start Time</th>
							<th className="px-4 py-3 text-sm font-semibold text-slate-600">End Time</th>
							<th className="px-4 py-3 text-sm font-semibold text-slate-600">Time Spent</th>
						</tr>
						</thead>

						<tbody>
							{data.length === 0 && !loading ? (
								<tr>
									<td colSpan={5} className="px-4 py-6 text-center text-slate-500">
										No results. Adjust filters to fetch data.
									</td>
								</tr>
							) : (
								data.map((r, idx) => (
								<tr key={r.id ?? idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
									<td className="px-4 py-3">{r.user_name ?? r.user ?? r.user_id}</td>
									<td className="px-4 py-3">{r.cam_number ?? r.cam ?? r.camera}</td>
									<td className="px-4 py-3">{formatTS(r.entry_time)}</td>
									<td className="px-4 py-3">{formatTS(r.exit_time)}</td>
									<td className="px-4 py-3">{computeTimeSpent(r.entry_time, r.exit_time, r.time_spent_seconds ?? r.time_spent)}</td>
								</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="p-4 flex items-center justify-end gap-2">
					<button
						onClick={() => fetchReport(new AbortController().signal)}
						className="px-3 py-2 border rounded text-sm flex items-center gap-2"
					>
						<RotateCw className="w-4 h-4" /> Refresh
					</button>
				</div>
			</div>
		</div>
	);
}
