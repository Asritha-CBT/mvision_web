import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Play, Trash2, Square, Layers } from "lucide-react"; 
export default function EmbeddingModal({
	user,
	isOpen,
	onClose,
	BASE_URL,
	loadUsers,
}) { 
	const [mode, setMode] = useState(null);  
	const [confirmed, setConfirmed] = useState(false);
	const [started, setStarted] = useState(false);
	const [timer, setTimer] = useState(0);
	const [embeddingCollectionCompleted, setEmbeddingCollectionCompleted] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [extractionCompleted, setExtractionCompleted] = useState(false);
	const [progress, setProgress] = useState(0);
	const [stage, setStage] = useState("");
	const [message, setMessage] = useState(""); 
	const progressIntervalRef = useRef(null);
	const [categories, setCategories] = useState([]);
	const [category_id, setCategoryId] = useState("");
 

	// Reset modal when opened
	useEffect(() => {
		if (isOpen) {
			setMode(null); 
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
			await axios.delete(`${BASE_URL}/api/extraction/remove/${user.id}`, {
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
	const handleStart = async () => {
		try {
			await axios.post(`${BASE_URL}/api/extraction/start`, {
				id: user.id,
				category_id: category_id ?? null
			});
			setStarted(true);
			setEmbeddingCollectionCompleted(false);
			alert("Embedding process started!");
		} catch (err) {
			console.error(err);
			alert("Error starting embedding.");
		}
	};

	const handleStop = async () => {
		try {
			await axios.post(`${BASE_URL}/api/extraction/stop`); 
			setEmbeddingCollectionCompleted(true);
			setStarted(false);
			setTimer(0);
			setMode(null); 
			alert("Embedding process stopped!");
			loadUsers();
		} catch (err) {
			console.error(err);
			alert("Error stopping embedding.");
		}
	}; 
	if (!isOpen) return null;

	const handleExtract = async () => {
		try {
			setIsProcessing(true);
			setExtractionCompleted(false);
			setProgress(0);

			const res = await axios.post(`${BASE_URL}/api/extraction/extract`, {
			id: user.id,
			category_id: category_id != null ? Number(category_id) : null,
			});

			// Always poll after started
			if (res.data?.status === "started") {
			callProgressService(user.id);
			} else if (res.data?.status === "error") {
			throw new Error(res.data?.message || "Extraction error");
			}
		} catch (err) {
			console.error(err.response?.data || err);
			alert("Extraction failed");
			setIsProcessing(false);
		}
		};

	const callProgressService = (userId) => {
		// clear any old poller
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
		}

		progressIntervalRef.current = setInterval(async () => {
			try {
				const res = await axios.get(`${BASE_URL}/api/extraction/progress/${userId}`);
				const data = res.data;

				setProgress(Number(data.percent ?? 0));
				setStage(data.stage ?? "");
				setMessage(data.message ?? "");

				//stop polling only when backend says done or error
				if (data.stage === "done") {
					clearInterval(progressIntervalRef.current);
					progressIntervalRef.current = null;

					setProgress(100);
					setIsProcessing(false);
					setExtractionCompleted(true);

					//refresh users NOW (this syncs UI with DB commit)
					loadUsers();  // <--- IMPORTANT
				}

				if (data.stage === "error") {
					clearInterval(progressIntervalRef.current);
					progressIntervalRef.current = null;

					setIsProcessing(false);
					setExtractionCompleted(false);

					alert(data.message || "Extraction failed");
				}

			} catch (err) {
				console.error("Progress error:", err);
				clearInterval(progressIntervalRef.current);
				progressIntervalRef.current = null;
				setIsProcessing(false);
				alert("Progress check failed");
			}
		}, 1500);
	};


	useEffect(() => {
		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		};
	}, []);
	
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await axios.get(`${BASE_URL}/api/extraction/categories`);
				setCategories(res.data);
			} catch (err) {
				console.error("Failed to load categories", err);
			}
		}; 
		fetchCategories();
	}, []);

	return (
		<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
			<div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 text-black">

				<h1 className="text-xl font-semibold text-center mb-4 font-heading">
					Manage Embedding for <span className="text-blue-600">{user?.name}</span>
				</h1>

				{/* Option Buttons */}
				<div className="flex justify-center gap-3 mb-5">
					{/* New Embeddings Button */}
					{!isProcessing && (
						<button
							onClick={() => {
								setMode("add");
								setConfirmed(true);
								setStarted(false);
								setTimer(0);
							}}
							className={`
								flex items-center gap-2 px-4 py-2 rounded-lg border 
								transition-colors duration-200 
								${mode === "add" ? "bg-sky-600 text-white border-sky-600" : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100"}
							`}
							title="Start collecting images"
						>
							<Plus size={18} className={mode === "add" ? "text-white" : "text-blue-600"} />
							New
						</button>  
					)}
					{(
						(user.face_embedding !== null  || 
						 user.body_embedding !== null ) &&  (
							<button
								onClick={() => {
									setMode("remove");
									setConfirmed(false);
									setStarted(false);
									setTimer(0);
								}}
								className={`
									flex items-center gap-2 px-4 py-2 rounded-lg border 
									transition-colors duration-200
									${mode === "remove" ? "bg-red-600 text-white border-red-600" : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-red-100"}
								`}
							>
								<Trash2 size={18} className={mode === "remove" ? "text-white" : "text-red-600"} />
								Remove
							</button>
						)
					)}
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

				{/* UPSERT */}
				{(mode === "add" ) && (
					<div> 
						{/* Start/Stop only after Add OR confirmed Update */}
						{confirmed && (
							<div> 
								{/* Show success message when extraction is done */} 
								{embeddingCollectionCompleted && (
									<div className="text-green-400 font-semibold text-center">
										Images collected successfully !
									</div>
								)}
								{/* TIMER */}
								{started && (
									<div className="text-center text-green-600 font-semibold text-sm mb-2">
										Collecting images: {formatTime(timer)}
									</div>
								)}

								<div className="flex justify-center gap-4 mt-4">
									{!started && mode === "add" && (
									 <div className="flex items-center gap-4">
    
										<select
											value={category_id}
											onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
											className="px-4 py-2 rounded-lg border border-gray-500 bg-gray-800 text-white"
											>
											<option value="">Select Category</option>
											{categories.map(c => (
												<option key={c.id} value={c.id}>
												{c.name}
												</option>
											))}
										</select> 
										<button
											onClick={handleStart}
											disabled={!category_id}
											className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer
												${category_id 
												? "bg-green-600 hover:bg-green-700 text-white"
												: "bg-gray-600 text-gray-300 cursor-not-allowed"
												}`}
											>
											<Play size={18} />
											Start
										</button>
									</div>
									)}

									{started && (
										<button
											onClick={handleStop}
											className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
											title="Stop collecting images"
										>
											<Square size={18} />
											Stop
										</button>
									)}
									
								</div>
							</div>
						)}
					</div>
				)} 
				
				<div className="flex justify-center gap-1 mb-1">
					{!extractionCompleted && embeddingCollectionCompleted && !isProcessing && (
					<button
						onClick={handleExtract}
						className="flex items-center gap-2 px-5 py-2 bg-sky-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md hover:shadow-lg"
						title="This will replace the old embeddings with new."
					>
						<Layers  size={18} />
						Extract
					</button>
					)} 
				</div>
				<div className="flex justify-center gap-1 mb-1">	
					{isProcessing && (
						<div className="flex items-center gap-3 px-5 py-2 bg-gray-100 rounded-lg">
							<div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
							<span className="text-gray-700 font-medium">
								Processing...
							</span>
						</div>
					)} 
				</div>
				<div className="flex justify-center gap-1 mb-1">	
					{extractionCompleted && !isProcessing && (
						<p className="text-green-600 font-semibold">
							Extraction Completed successfully
						</p>
					)}
				</div>
				<div className="flex justify-center gap-1 mb-1">	
					{isProcessing && (
						<div className="w-full mt-4">
							<p className="text-sm mb-1">{message}</p>
							<div className="w-full bg-gray-700 rounded">
								<div
									className="bg-green-500 h-2 rounded transition-all"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<p className="text-xs mt-1">{progress}%</p>
						</div>
					)}
				</div> 
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
