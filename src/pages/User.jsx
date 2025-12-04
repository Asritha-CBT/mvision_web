// Users.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Card from "../components/Card.jsx";
import Table from "../components/Table.jsx";
import Form from "../components/Form.jsx";
import Modal from "../components/Modal.jsx";

export default function Users() {
  const BASE_URL = "http://127.0.0.1:8000/users";

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ---------- FETCH USERS ----------
  const loadUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users`);
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
      await axios.delete(`${BASE_URL}/delete/${id}`);
      loadUsers(); // refresh table
    } catch (err) {
      console.error("Delete error:", err);
    }
  };


    // ---------- UPDATE EMBEDDINGS ----------
  const handleEmbedding = async (user) => {
    const path = prompt("Enter embeddings file path:");

    if (path === null) return; // cancelled

await axios.put(`${BASE_URL}/update_embeddings/${user.id}`, {
    embeddings_path: path.trim() === "" ? null : path
});


    try {
      await axios.put(`${BASE_URL}/update_embeddings/${user.id}`, {
        embeddings_path: path,
      });

      loadUsers();
      alert("Embeddings updated!");
    } catch (err) {
      console.error("Embedding error:", err);
    }
  };

  // ---------- ADD or EDIT ----------
  const handleSubmit = async (data) => {
    try {
      if (selectedUser) {
        // UPDATE
        await axios.put(`${BASE_URL}/update/${selectedUser.id}`, data);
      } else {
        // INSERT
        await axios.post(`${BASE_URL}/user_register`, data);
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
          <h2 className="text-xl font-bold">Users</h2>
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
    u.embeddings_path || "Not added",
    <div className="flex gap-2" key={u.id}>
      <button
        className="px-2 py-1 bg-green-500 text-white rounded"
        onClick={() => handleEmbedding(u)}
      >
        Add/Update Embeddings
      </button>
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
