import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../components/Card.jsx";
import Table from "../components/Table.jsx";
import Form from "../components/Form.jsx";
import Modal from "../components/Modal.jsx"; 
import EmbeddingModal from "../components/EmbeddingModal.jsx"; 

export default function Users() {
	const BASE_URL = "http://127.0.0.1:8000"; 

	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [modalOpen, setModalOpen] = useState(false); 
	const [modalUser, setModalUser] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// ---------- FETCH USERS ----------
		const loadUsers = async () => {
			try {
				const res = await axios.get(`${BASE_URL}/users/users`);
				console.log('------------------ Printing User Data -------------------------',res.data);
				setUsers(res.data);
			} catch (err) {
				console.error("Error loading users:", err);
			}
		};

		useEffect(() => {
			loadUsers();
		}, []);

	// ---------- OPEN ADD ----------
		const handleAdd = () => {
			setSelectedUser(null);
			setModalOpen(true);
		};

	// ---------- OPEN EDIT ----------
		const handleEdit = (user) => {
			setSelectedUser(user);
			setModalOpen(true);
		};

	// ---------- DELETE USER ----------
		const handleDelete = async (id) => {
			try {
				await axios.delete(`${BASE_URL}/users/delete/${id}`);
				loadUsers(); // refresh table
			} catch (err) {
				console.error("Delete error:", err);
			}
		};


	// ---------- HANDLE EMBEDDINGS ----------
		const handleEmbedding = (user) => {
			setModalUser(user);
			setIsModalOpen(true);
		};

	// ---------- ADD or EDIT ----------
		const handleSubmit = async (data) => {
			try {
				if (selectedUser) {
					// UPDATE
					await axios.put(`${BASE_URL}/users/update/${selectedUser.id}`, data);
				} else {
					// INSERT
					await axios.post(`${BASE_URL}/users/user_register`, data);
				} 
				loadUsers(); 
				setModalOpen(false);  
			} catch (err) {
				console.error("Submit error:", err);
			}
		};

	return (
		<div className="p-6 space-y-4">
			<Card>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold font-heading">Users</h2>
					<button
						className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
						onClick={handleAdd}
					>
						User Registration
					</button>
				</div>
				{/* TABLE */}
				<Table
					columns={["Name", "Department", "Embeddings", "Actions"]}
					data={users.map((u) => [
						u.name,
						u.department,
						(u.embedding && Array.isArray(u.embedding) && u.embedding.length > 0)
						? "Added"
						: "Not added"
						,
						<div className="flex gap-2" key={u.id}>
							<button
								className="px-2 py-1 bg-green-500 text-white rounded"
								onClick={() => handleEmbedding(u)}
							>
								Embeddings
							</button>
							<EmbeddingModal
								user={modalUser}
								isOpen={isModalOpen}
								onClose={() => setIsModalOpen(false)}
								BASE_URL={BASE_URL}
								loadUsers={loadUsers}
							/>
							<button
								className="px-2 py-1 bg-yellow-500 text-white rounded"
								onClick={() => handleEdit(u)}
							>
								Edit
							</button>
							<button
								className="px-2 py-1 bg-red-600 text-white rounded"
								onClick={() => handleDelete(u.id)}
							>
								Delete
							</button>
						</div>,
					])}
				/> 
			</Card>

			{modalOpen && (
				<Modal onClose={() => setModalOpen(false)}>
					<Form
						initialData={selectedUser || { name: "", department: "" }}
						onSubmit={handleSubmit}
					/>
				</Modal>
			)}
		</div>
	);
}
