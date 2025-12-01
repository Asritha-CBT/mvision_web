import React, { useState } from "react";
import Card from "../components/Card.jsx";
import Table from "../components/Table.jsx";
import Form from "../components/Form.jsx";
import Modal from "../components/Modal.jsx";

const initialUsers = [
  { id: 1, name: "John Doe", department: "Biotech" },
  { id: 2, name: "Jane Smith", department: "IT" },
];

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleSubmit = (data) => {
    if (selectedUser) {
      // Edit
      setUsers(users.map((u) => (u.id === selectedUser.id ? data : u)));
    } else {
      // Add
      setUsers([...users, { id: Date.now(), ...data }]);
    }
    setModalOpen(false);
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
        <Table
          columns={["Name", "Department", "Actions"]}
          data={users.map((u) => [
            u.name,
            u.department,
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-green-500 text-white rounded"
                onClick={() => handleEdit(u)}
              >
                Add embeddings
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
