import React, { useEffect, useState, useRef, useMemo } from "react";
import { Activity, Clock, DownloadCloud, RotateCw, Search, Users, Camera } from "lucide-react";
import { FastAPIConfig } from '../constants/configConstants';
import axios from "axios";

// UserPresenceReport.jsx (with search + pagination)

export default function UserPresenceReport() {
	const getNow = () => {
		const now = new Date();
		const offset = now.getTimezoneOffset() * 60000;
		return new Date(now - offset).toISOString().slice(0, 16);
	};

	// filters
	const [from, setFrom] = useState(getNow());
	const [to, setTo] = useState(getNow());
	const [camNum, setCamNum] = useState("");
	const [userId, setUserId] = useState("");

	// data / ui state
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const [cams, setCams] = useState([]);
	const [users, setUsers] = useState([]);

	// search + pagination
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [perPage, setPerPage] = useState(10);

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

	const fetchReport = async (signal) => {
		setLoading(true);
		setError(null);

		try {
			const q = buildQuery();
			const url = `${FastAPIConfig.BASE_URL}/reports/user_presence${q ? "?" + q : ""}`;
			const res = await axios.get(url, { signal });
			const json = res.data;
			setData(Array.isArray(json) ? json : json.data || []);
			setPage(0); // reset to first page after fresh load
		} catch (err) {
			if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
				setError(err.message || "Failed to fetch");
			}
		} finally {
			setLoading(false);
		}
	};

	// Debounced effect: call fetchReport when filters change
	useEffect(() => {
		// cancel existing timer
		if (timerRef.current) clearTimeout(timerRef.current);
		if (abortRef.current) abortRef.current.abort();

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
		const controller = new AbortController();
		let mounted = true;

		const fetchFiltersData = async () => {
			try {
				const [camsRes, usersRes] = await Promise.all([
					axios.get(`${FastAPIConfig.BASE_URL}/reports/cameras`, {
						signal: controller.signal,
					}),
					axios.get(`${FastAPIConfig.BASE_URL}/users/users`, {
						signal: controller.signal,
					}),
				]);

				if (!mounted) return;

				setCams(Array.isArray(camsRes.data) ? camsRes.data : camsRes.data?.data || []);
				setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || []);
			} catch (err) {
				if (axios.isCancel(err)) return;
				console.error("Failed to load filter data", err);
			}
		};
		fetchFiltersData();
		return () => {
			mounted = false;
			controller.abort();
		};
	}, []);

	// Utility: compute time spent between start and end
	const computeTimeSpent = (startIso, endIso, time_spent_seconds) => {
		if (time_spent_seconds != null) {
			const s = Number(time_spent_seconds);
			if (isNaN(s)) return "-";
			const hrs = Math.floor(s / 3600);
			const mins = Math.floor((s % 3600) / 60);
			const secs = Math.floor(s % 60);
			return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
		}

		if (!startIso || !endIso) return "-";

		const diff = new Date(endIso) - new Date(startIso);
		if (isNaN(diff) || diff < 0) return "-";

		const s = Math.floor(diff / 1000);
		const hrs = Math.floor(s / 3600);
		const mins = Math.floor((s % 3600) / 60);
		const secs = Math.floor(s % 60);

		return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${secs}s`;
	};

	// Date formatting (DD-MM-YYYY HH:mm:ss)
	const formatReadableDate = (iso) => {
		if (!iso) return "-";
		const d = new Date(iso);
		if (isNaN(d)) return "-";

		const pad = (n) => String(n).padStart(2, "0");

		const day = pad(d.getDate());
		const month = pad(d.getMonth() + 1);
		const year = d.getFullYear();

		return `${day}-${month}-${year} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	};

	// Client-side filtering: memoized
	const filtered = useMemo(() => {
		const q = (search || "").trim().toLowerCase();
		if (!q) return data;
		return data.filter((r) => {
			const parts = [
				r.user_name ?? r.user ?? String(r.user_id ?? ""),
				r.camera_name ?? r.cam_name ?? r.cam ?? r.camera ?? r.cam_number ?? "",
				formatReadableDate(r.entry_time),
				formatReadableDate(r.exit_time),
			]
				.join(" ")
				.toLowerCase();
			return parts.includes(q);
		});
	}, [data, search]);

	// Pagination calculations
	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const paginated = useMemo(() => {
		const start = page * perPage;
		return filtered.slice(start, start + perPage);
	}, [filtered, page, perPage]);

	// CSV generation and download (client-side)
	const downloadCSV = () => {
		if (!data || data.length === 0) return;

		const headers = ["Person", "Camera", "Entry Time", "Exit Time", "Time Spent"];

		const rows = data.map((r) => {
			const timeSpent = computeTimeSpent(
				r.entry_time,
				r.exit_time,
				r.time_spent_seconds ?? r.time_spent
			);

			return [
				r.user_name ?? r.user ?? r.user_id ?? "",
				r.camera_name ?? r.cam_name ?? r.cam ?? "",
				formatReadableDate(r.entry_time),
				formatReadableDate(r.exit_time),
				timeSpent,
			];
		});

		// Add BOM to fix Excel weird characters
		const csvContent =
			"\uFEFF" +
			[headers.join(","), ...rows.map((r) =>
				r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
			)].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `user_presence_report_${new Date().toISOString()}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Pagination helpers
	const gotoPage = (p) => {
		const np = Math.min(Math.max(0, p), totalPages - 1);
		setPage(np);
	};
	const handlePerPageChange = (n) => {
		setPerPage(Number(n));
		setPage(0);
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Activity className="w-6 h-6 text-yellow-400" />
					<div>
						<h2 className="text-2xl font-semibold">Person Presence Report</h2>
						<p className="text-sm text-slate-500">Filter and export presence reports per camera</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => { setFrom(getNow()); setTo(getNow()); setCamNum(""); setUserId(""); }}
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
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-300 p-4 rounded-lg shadow">
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
					<label className="text-sm font-medium text-slate-600 mb-1">Person</label>
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

			{/* Table Card with Search + Pagination */}
			<div className="bg-white rounded-lg shadow">
				{/* header: search + summary */}
				<div className="p-4 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Search className="w-5 h-5 text-slate-500" />
						<input
							type="search"
							placeholder="Search by name, camera, date..."
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(0); }}
							className="px-3 py-2 border rounded w-72 text-sm text-slate-500"
						/> 
						<div className="text-sm text-slate-600">
							Showing {Math.min(total, page * perPage + 1)} - {Math.min(total, (page + 1) * perPage)} of {total}
						</div>
					</div>

					{/* pagination controls */}
					<div className="flex items-center gap-2">
						<div className="text-sm text-slate-600 mr-2">
							Show
						</div>
						<select
							value={perPage}
							onChange={(e) => handlePerPageChange(e.target.value)}
							className="px-2 py-1 border rounded text-sm text-slate-500"
						>
							<option value={10}>10</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>

						<div className="flex items-center gap-1 ml-3 text-slate-600">
							<button
								onClick={() => gotoPage(page - 1)}
								disabled={page === 0}
								className={`px-2 py-1 border rounded text-sm text-slate-600 ${page === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								Prev
							</button>

							<div className="px-2 text-sm text-slate-600">
								Page {page + 1} / {totalPages}
							</div>

							<button
								onClick={() => gotoPage(page + 1)}
								disabled={page >= totalPages - 1}
								className={`px-2 py-1 border rounded text-sm ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								Next
							</button>
						</div>

					</div>
				</div>

				<div className=" max-h-[231px]">
					<div className="max-h-80 overflow-y-auto">
						<table className="w-full text-left border border-slate-200 border-collapse table-fixed">
						<thead className="bg-gray-700 text-white sticky top-0 z-10">
							<tr>
							<th className="px-4 py-3 text-sm font-semibold border border-slate-200 w-1/5">Person</th>
							<th className="px-4 py-3 text-sm font-semibold border border-slate-200 w-1/5">Camera</th>
							<th className="px-4 py-3 text-sm font-semibold border border-slate-200 w-1/5">Start Time</th>
							<th className="px-4 py-3 text-sm font-semibold border border-slate-200 w-1/5">End Time</th>
							<th className="px-4 py-3 text-sm font-semibold border border-slate-200 w-1/5">Time Spent</th>
							</tr>
						</thead>

						<tbody>
							{paginated.length === 0 && !loading ? (
							<tr>
								<td colSpan={5} className="px-4 py-6 text-center text-slate-500">
								No results. Adjust filters to fetch data.
								</td>
							</tr>
							) : (
							paginated.map((r, idx) => (
								<tr
								key={r.id ?? idx}
								className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-100"} text-slate-600`}
								>
								<td className="px-4 py-3 border border-slate-200">
									{r.user_name ?? r.user ?? r.user_id}
								</td>
								<td className="px-4 py-3 border border-slate-200">
									{r.camera_name ?? r.cam_name ?? r.cam ?? r.camera ?? r.cam_number}
								</td>
								<td className="px-4 py-3 border border-slate-200">
									{formatReadableDate(r.entry_time)}
								</td>
								<td className="px-4 py-3 border border-slate-200">
									{formatReadableDate(r.exit_time)}
								</td>
								<td className="px-4 py-3 border border-slate-200">
									{computeTimeSpent(
									r.entry_time,
									r.exit_time,
									r.time_spent_seconds ?? r.time_spent
									)}
								</td>
								</tr>
							))
							)}
						</tbody>
						</table>
					</div>
				</div> 

				{/* bottom pagination (optional detailed controls) */}
				{/* <div className="p-4 flex items-center justify-between gap-2 text-black">
					<div className="text-sm text-slate-600">
						Showing {Math.min(total, page * perPage + 1)} - {Math.min(total, (page + 1) * perPage)} of {total}
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={() => gotoPage(0)}
							disabled={page === 0}
							className={`px-2 py-1 border rounded text-sm ${page === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							First
						</button>
						<button
							onClick={() => gotoPage(page - 1)}
							disabled={page === 0}
							className={`px-2 py-1 border rounded text-sm ${page === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							Prev
						</button>
						<button
							onClick={() => gotoPage(page + 1)}
							disabled={page >= totalPages - 1}
							className={`px-2 py-1 border rounded text-sm ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							Next
						</button>
						<button
							onClick={() => gotoPage(totalPages - 1)}
							disabled={page >= totalPages - 1}
							className={`px-2 py-1 border rounded text-sm ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							Last
						</button>
					</div>
				</div> */}
			</div>
		</div>
	);
}
