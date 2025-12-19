// Users.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../components/Card.jsx";
import Table from "../components/Table.jsx";
import CommonForm from "../components/CommonForm.jsx";
import Modal from "../components/Modal.jsx";
import EmbeddingModal from "../components/EmbeddingModal.jsx";
import { Plus, Pencil, Trash2, ScanFace } from "lucide-react"; 
import {FastAPIConfig} from '../constants/configConstants';

export default function Users() {

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Embedding modal controls (single modal instance)
  const [modalUser, setModalUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---------- FETCH USERS ----------
  const loadUsers = async () => {
    try {
      const res = await axios.get(`${FastAPIConfig.BASE_URL}/users/users`); 
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
    const ok = window.confirm("Are you sure you want to delete this person?");
    if (!ok) return;

    try {
      await axios.delete(`${FastAPIConfig.BASE_URL}/users/delete/${id}`);
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
        await axios.put(`${FastAPIConfig.BASE_URL}/users/update/${selectedUser.id}`, data);
      } else {
        // INSERT
        await axios.post(`${FastAPIConfig.BASE_URL}/users/user_register`, data);
      }
      loadUsers();
      setModalOpen(false);
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  // Build table rows
  const tableData = users.map((u) => [
    u.name,
    u.department,
    // Embeddings status badge
    u.face_embedding && Array.isArray(u.face_embedding) && u.face_embedding.length > 0 || 
	u.body_embedding && Array.isArray(u.body_embedding) && u.body_embedding.length > 0 ? (
      <span
        className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-600 text-white"
        key={`embed-${u.id}`}
      >
        Added
      </span>
    ) : (
      <span
        className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-700 text-gray-200"
        key={`embed-${u.id}`}
      >
        Not added
      </span>
    ),
    // Actions column
    <div className="flex items-center gap-2" key={`actions-${u.id}`}>
      {/* Manage embeddings */}
      <button
        title="Manage Embeddings"
        aria-label={`Manage embeddings for ${u.name}`}
        onClick={() => handleEmbedding(u)}
        className="p-2 rounded hover:bg-sky-700/20 transition-colors"
      >
        <ScanFace size={18} className="text-sky-400" />
      </button>

      {/* Edit */}
      <button
        title="Edit"
        aria-label={`Edit ${u.name}`}
        onClick={() => handleEdit(u)}
        className="p-2 rounded hover:bg-yellow-500/20 transition-colors"
      >
        <Pencil size={18} className="text-yellow-400" />
      </button>

      {/* Delete */}
      <button
        title="Delete"
        aria-label={`Delete ${u.name}`}
        onClick={() => handleDelete(u.id)}
        className="p-2 rounded hover:bg-red-600/20 transition-colors"
      >
        <Trash2 size={18} className="text-red-400" />
      </button>
    </div>,
  ]);

  return (
    <div className="p-6 space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-heading">Persons</h2>

          {/* Add button */}
          <button
            onClick={handleAdd}
            title="New  Person"
            aria-label="Add new person"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-shadow shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New  Person</span>
          </button>
        </div>

        {/* TABLE */}
        <Table columns={["Name", "Department", "Embeddings", "Actions"]} data={tableData} />
      </Card>

      {/* Add / Edit Modal */}
      {modalOpen && (
		<Modal onClose={() => setModalOpen(false)}>
			<CommonForm
				title={selectedUser ? "Update  Person" : "Person Registration"}
				initialData={selectedUser || { name: "", department: "" }}
				onSubmit={handleSubmit}
				fields={[
					{ name: "name", label: "Name", type: "text", required: true },
					{ name: "department", label: "Department", type: "text", required: true }
				]}
				validate={(form) => {
					const e = {};
					if (!form.name?.trim()) e.name = "Name is required";
					if (!form.department?.trim()) e.department = "Department is required";
					return e;
				}}
			/>
		</Modal>

      )}

      {/* Embedding modal: single instance controlled by modalUser */}
      {isModalOpen && modalUser && (
        <EmbeddingModal
          user={modalUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalUser(null);
            loadUsers(); // refresh after embedding changes
          }}
          BASE_URL={FastAPIConfig.BASE_URL}
          loadUsers={loadUsers}
        />
      )}
    </div>
  );
}
