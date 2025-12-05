import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EmbeddingModal({
	user,
	isOpen,
	onClose,
	BASE_URL,
	loadUsers,
}) { 
	const [mode, setMode] = useState(null); 
	const [path, setPath] = useState("");
	const [confirmed, setConfirmed] = useState(false);
	const [started, setStarted] = useState(false);
	const [timer, setTimer] = useState(0);

	// Reset modal when opened
	useEffect(() => {
		if (isOpen) {
			setMode(null);
			setPath("");
			setConfirmed(false);
			setStarted(false);
			setTimer(0);
		}
	}, [isOpen]);

	// Timer logic
	useEffect(() => {
		let interval = null;
		if (started) {
			interval = setInterval(() => {
				setTimer((t) => t + 1);
			}, 1000);
		} else {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [started]);

	const formatTime = (seconds) => {
		const m = String(Math.floor(seconds / 60)).padStart(2, "0");
		const s = String(seconds % 60).padStart(2, "0");
		return `${m}:${s}`;
	};

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to REMOVE this embedding?")) return;

		try {
			await axios.delete(`${BASE_URL}/api/extraction/remove_embedding/${user.id}`, {
				id: user.id
			});
			alert("Embedding removed!");
			loadUsers();
			onClose();
		} catch (err) {
			console.error(err);
			alert("Error removing embedding.");
		}
	};

	const handleUpdateConfirm = () => {
		if (!window.confirm("Are you sure you want to UPDATE this embedding?")) return;
		setConfirmed(true);
	};

	const handleStart = async () => {
		try {
			await axios.post(`${BASE_URL}/api/extraction/start`, {
				id: user.id
			});
			setStarted(true);
			alert("Embedding process started!");
		} catch (err) {
			console.error(err);
			alert("Error starting embedding.");
		}
	};

	const handleStop = async () => {
		try {
			await axios.post(`${BASE_URL}/api/extraction/stop`);
			setStarted(false);
			setTimer(0);
			alert("Embedding process stopped!");
			loadUsers();
		} catch (err) {
			console.error(err);
			alert("Error stopping embedding.");
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
			<div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 text-black">

				<h2 className="text-xl font-semibold text-center mb-4 font-heading">
					Manage Embedding for <span className="text-blue-600">{user?.name}</span>
				</h2>

				{/* Option Buttons */}
				<div className="flex justify-center gap-3 mb-5">
					<button
						className={`px-4 py-2 rounded-lg border ${
							mode === "add" ? "bg-blue-600 text-white" : "bg-gray-100"
						}`}
						onClick={() => {
							setMode("add");
							setConfirmed(true);
							setStarted(false);
							setTimer(0);
						}}
					>
						Add
					</button>

					<button
						className={`px-4 py-2 rounded-lg border ${
							mode === "update" ? "bg-blue-600 text-white" : "bg-gray-100"
						}`}
						onClick={() => {
							setMode("update");
							setConfirmed(false);
							setStarted(false);
							setTimer(0);
						}}
					>
						Update
					</button>

					<button
						className={`px-4 py-2 rounded-lg border ${
							mode === "remove" ? "bg-red-600 text-white" : "bg-gray-100"
						}`}
						onClick={() => {
							setMode("remove");
							setConfirmed(false);
							setStarted(false);
							setTimer(0);
						}}
					>
						Remove
					</button>
				</div>

				{/* REMOVE */}
				{mode === "remove" && (
					<div className="flex flex-col items-center gap-4">
						<p className="text-red-600 font-medium">This action cannot be undone.</p>
						<button
							className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
							onClick={handleDelete}
						>
							Confirm Delete
						</button>
					</div>
				)}

				{/* ADD & UPDATE */}
				{(mode === "add" || mode === "update") && (
					<div>
						{/* UPDATE → confirmation first */}
						{mode === "update" && !confirmed && (
							<button
								className="w-full bg-yellow-500 text-white py-2 rounded-lg mb-4 hover:bg-yellow-600"
								onClick={handleUpdateConfirm}
							>
								Confirm Update
							</button>
						)}

						{/* Start/Stop only after Add OR confirmed Update */}
						{confirmed && (
							<div>
								{/* TIMER */}
								{started && (
									<div className="text-center text-green-600 font-semibold text-lg mb-2">
										Extracting: {formatTime(timer)}
									</div>
								)}

								<div className="flex justify-center gap-4 mt-4">
									<button
										className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
										onClick={handleStart}
										disabled={started}
									>
										Start
									</button>

									<button
										className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
										onClick={handleStop}
										disabled={!started}
									>
										Stop
									</button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Close */}
				<div className="flex justify-end gap-3 mt-6">
					<button className="px-4 py-2 bg-gray-300 text-black rounded-lg" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
