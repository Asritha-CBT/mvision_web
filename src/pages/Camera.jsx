// Cameras.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Card from "../components/Card.jsx";
import Table from "../components/Table.jsx";
import CommonForm from "../components/CommonForm.jsx";
import Modal from "../components/Modal.jsx";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { FastAPIConfig } from "../constants/configConstants";

export default function Cameras() {
	const [cameras, setCameras] = useState([]);
	const [area_definitions, setAreaDefinitions] = useState([]);
	const [selectedCamera, setSelectedCamera] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);

	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const perPage = 6; 

	// ---- CHANGE THESE IF YOUR BACKEND ROUTES DIFFER ----
	const API = {
		listCameras: `${FastAPIConfig.BASE_URL}/camera/cameras`,
		createCamera: `${FastAPIConfig.BASE_URL}/camera/create`,
		updateCamera: (id) => `${FastAPIConfig.BASE_URL}/camera/update/${id}`,
		deleteCamera: (id) => `${FastAPIConfig.BASE_URL}/camera/delete/${id}`,

		// area_definitions
		listAreaDefinitions: `${FastAPIConfig.BASE_URL}/area_definition/area_definitions`,
	};

	// ---------- FETCH ----------
	const loadCameras = async () => {
		try {
			const res = await axios.get(API.listCameras);
			setCameras(res.data || []);
		} catch (err) {
			console.error("Error loading cameras:", err);
		}
	};

	const loadAreaDefinitions = async () => {
		try {
			const res = await axios.get(API.listAreaDefinitions);
			setAreaDefinitions(res.data || []);
		} catch (err) {
			console.error("Error loading area_definitions:", err);
			setAreaDefinitions([]);
		}
	};

	useEffect(() => {
		loadCameras();
		loadAreaDefinitions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const area_definitionNameById = useMemo(() => {
		const map = new Map();
		for (const c of area_definitions) map.set(c.id, c.name);
		return map;
	}, [area_definitions]);

	// ---------- OPEN ADD ----------
	const handleAdd = () => {
		setSelectedCamera(null);
		setModalOpen(true);
	};

	// ---------- OPEN EDIT ----------
	const handleEdit = (cam) => {
		setSelectedCamera(cam);
		setModalOpen(true);
	};

	// ---------- DELETE ----------
	const handleDelete = async (id) => {
		const ok = window.confirm("Are you sure you want to delete this camera?");
		if (!ok) return;

		try {
			await axios.delete(API.deleteCamera(id));
			alert("Camera deleted successfully!");
			loadCameras();
		} catch (err) {
			const message =
				err.response?.data?.detail ||
				"Something went wrong. Please try again.";

			alert(message);
			console.error("Delete error:", err.response || err);
		}
	};


	// ---------- ADD / EDIT SUBMIT ----------
	const handleSubmit = async (data) => {
		try {
			const payload = {
				...data,
				area_definition_id: data.area_definition_id !== "" ? Number(data.area_definition_id) : data.area_definition_id,
			};

			if (selectedCamera) {
				await axios.put(API.updateCamera(selectedCamera.id), payload);
				alert("Camera updated successfully!");
			} else {
				await axios.post(API.createCamera, payload);
				alert("Camera created successfully!");
			}
			setModalOpen(false);
			loadCameras();
		} catch (err) {
			// Show backend message if present (FastAPI sends {"detail": "..."} )
			const backendMsg =
			err?.response?.data?.detail ||
			err?.response?.data?.message ||
			(typeof err?.response?.data === "string" ? err.response.data : null);

			alert(backendMsg || "Something went wrong. Please try again.");
			console.error("Submit error:", err);
		}
	};


	// ---------- SEARCH (on raw cameras, not table rows) ----------
	const filteredCameras = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return cameras;

		return cameras.filter((cam) => {
			const areaDefName =
				cam?.area_definition?.name ??
				area_definitionNameById.get(cam?.area_definition_id) ??
				"NA"; 
			const cameraIP = cam?.camera_ip ?? "";
			const hay = `${cam.camera_name ?? ""} ${cameraIP} ${areaDefName}`.toLowerCase();
			return hay.includes(q);
		});
	}, [cameras, search, area_definitionNameById]);

	// ---------- PAGINATION ----------
	const total = filteredCameras.length;
	const totalPages = Math.max(1, Math.ceil(total / perPage));

	const paginatedCameras = useMemo(() => {
		const start = page * perPage;
		return filteredCameras.slice(start, start + perPage);
	}, [filteredCameras, page, perPage]);

	useEffect(() => {
		// keep page valid when filtering shrinks results
		if (page > totalPages - 1) setPage(0);
	}, [totalPages, page]);

	const handleSearch = (e) => {
		setSearch(e.target.value);
		setPage(0);
	};

	// ---------- TABLE ROWS ----------
	const tableData = paginatedCameras.map((cam) => {
		const areaDefName =
		cam?.area_definition?.name ??
		area_definitionNameById.get(cam?.area_definition_id) ??
		"NA";

		return [
			cam.camera_name, 
			cam.camera_ip, 
			areaDefName,
			<div className="flex items-center gap-2" key={`actions-${cam.id}`}>
				<button
				title="Edit"
				aria-label={`Edit ${cam.camera_name}`}
				onClick={() => handleEdit(cam)}
				className="p-2 rounded hover:bg-yellow-500/20 transition-colors"
				>
					<Pencil size={18} className="text-yellow-400" />
				</button>

				<button
				title="Delete"
				aria-label={`Delete ${cam.camera_name}`}
				onClick={() => handleDelete(cam.id)}
				className="p-2 rounded hover:bg-red-600/20 transition-colors"
				>
					<Trash2 size={18} className="text-red-400" />
				</button>
			</div>,
		];
	});

	// ---------- FORM ----------
	const area_definitionOptions = area_definitions.map((c) => ({
		label: c.name,
		value: String(c.id),
	}));

  	const initialData = selectedCamera
    ? {
        camera_name: selectedCamera.camera_name ?? "", 
        camera_ip: selectedCamera.camera_ip ?? "", 
        area_definition_id: String(
          selectedCamera.area_definition_id ??
            selectedCamera?.area_definition?.id ??
            ""
        ),
      }
    : {
        camera_name: "", 
		camera_ip: "",
        area_definition_id: area_definitionOptions[0]?.value ?? "",
      };

  return (
    <div className="p-6 space-y-4">
		<Card>
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold font-heading">Cameras</h2>

				<button
				onClick={handleAdd}
				title="New Camera"
				aria-label="Add new camera"
				className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-shadow shadow-sm hover:shadow-md"
				>
					<Plus size={20} />
					<span className="hidden sm:inline">New Camera</span>
				</button>
			</div>

			<div className="space-y-4">
				{/* Search */}
				<input
				type="text"
				value={search}
				onChange={handleSearch}
				placeholder="Search cameras..."
				className="px-3 py-2 border rounded bg-[rgb(72_83_105/81%)] border-gray-700"
				/>

				{/* Table */}
				<Table
				columns={["Name", "IP Address", "Area Definition", "Actions"]}
				data={tableData}
				/>

				{/* Pagination */}
				<div className="flex items-center justify-between mt-3">
					<span>
						Page {page + 1} of {totalPages}
					</span>
					<div className="flex gap-2">
						<button
						disabled={page === 0}
						onClick={() => setPage((p) => p - 1)}
						className="px-3 py-1 border rounded disabled:opacity-40"
						>
						Prev
						</button>

						<button
						disabled={page + 1 === totalPages}
						onClick={() => setPage((p) => p + 1)}
						className="px-3 py-1 border rounded disabled:opacity-40"
						>
						Next
						</button>
					</div>
				</div>
			</div>
		</Card>

      {/* Add/Edit Modal */}
        {modalOpen && (
			<Modal onClose={() => setModalOpen(false)}>
				<CommonForm
					title={selectedCamera ? "Update Camera" : "Create Camera"}
					initialData={initialData}
					onSubmit={handleSubmit}
					fields={[
						{ name: "camera_name", label: "Name", type: "text", required: true },  
						{ name: "camera_ip", label: "IP Address", type: "text", required: true },
						{ name: "area_definition_id", label: "Area Definition", type: "select", required: true, options: area_definitionOptions }, 
					]}
					validate={(form) => {
						const e = {};

						if (!form.camera_name?.trim())
							e.camera_name = "Camera name is required";

						if (!form.camera_ip?.trim())
							e.camera_ip = "IP Address is required";
						else if (
							!/^(\d{1,3}\.){3}\d{1,3}$/.test(form.camera_ip)
						)
							e.camera_ip = "Enter a valid IP address";

						if (form.area_definition_id === "" || form.area_definition_id == null)
							e.area_definition_id = "Area Definition is required";

						return e;
					}} 
				/>
			</Modal>
        )}
    </div>
  );
}
