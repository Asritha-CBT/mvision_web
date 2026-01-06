// CameraCategory.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Card from "../components/Card.jsx";
import Table from "../components/Table.jsx";
import CommonForm from "../components/CommonForm.jsx";
import Modal from "../components/Modal.jsx";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { FastAPIConfig } from "../constants/configConstants";

export default function CameraCategory() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 6;

  const API = {
    list: `${FastAPIConfig.BASE_URL}/category/categories`,
    create: `${FastAPIConfig.BASE_URL}/category/create`,
    update: (id) => `${FastAPIConfig.BASE_URL}/category/update/${id}`,
    delete: (id) => `${FastAPIConfig.BASE_URL}/category/delete/${id}`,
  };

  // ---------- FETCH ----------
  const loadCategories = async () => {
    try {
      const res = await axios.get(API.list);
      setCategories(res.data || []);
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- OPEN ADD ----------
  const handleAdd = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  // ---------- OPEN EDIT ----------
  const handleEdit = (cat) => {
    setSelectedCategory(cat);
    setModalOpen(true);
  };

  // ---------- DELETE ----------
  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this category?");
    if (!ok) return;

    try {
      await axios.delete(API.delete(id));
      alert("Category deleted successfully!");
      loadCategories();

    } catch (err) {
      console.error("Delete error:", err);

      // ✅ FastAPI error message handling
      const backendMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to delete category. It may be in use.";

      alert(backendMsg);
    }
  };


  // ---------- ADD / EDIT SUBMIT ----------
  const handleSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        name: data?.name?.trim?.() ?? data?.name,
        description: data?.description?.trim?.() ?? data?.description,
      };

      if (selectedCategory) {
        await axios.put(API.update(selectedCategory.id), payload);
        alert("Category updated successfully!");
      } else {
        await axios.post(API.create, payload);
        alert("Category created successfully!");
      }

      setModalOpen(false);
      loadCategories();
    } catch (err) {
      const backendMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null);

      alert(backendMsg || "Something went wrong. Please try again.");
      console.error("Submit error:", err);
    }
  };

  // ---------- SEARCH ----------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((c) => {
      const hay = `${c.name ?? ""} ${c.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [categories, search]);

  // ---------- PAGINATION ----------
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const paginated = useMemo(() => {
    const start = page * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [totalPages, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  // ---------- TABLE ----------
  const tableData = paginated.map((c) => [
    c.name,
    c.description ?? "—",
    <div className="flex items-center gap-2" key={`actions-${c.id}`}>
      <button
        title="Edit"
        aria-label={`Edit ${c.name}`}
        onClick={() => handleEdit(c)}
        className="p-2 rounded hover:bg-yellow-500/20 transition-colors"
      >
        <Pencil size={18} className="text-yellow-400" />
      </button>

      <button
        title="Delete"
        aria-label={`Delete ${c.name}`}
        onClick={() => handleDelete(c.id)}
        className="p-2 rounded hover:bg-red-600/20 transition-colors"
      >
        <Trash2 size={18} className="text-red-400" />
      </button>
    </div>,
  ]);

  const initialData = selectedCategory
    ? {
        name: selectedCategory.name ?? "",
        description: selectedCategory.description ?? "",
      }
    : { name: "", description: "" };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-heading">Camera Categories</h2>

          <button
            onClick={handleAdd}
            title="New Category"
            aria-label="Add new category"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-shadow shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Category</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search categories..."
            className="px-3 py-2 border rounded bg-[rgb(72_83_105/81%)] border-gray-700"
          />

          {/* Table */}
          <Table columns={["Name", "Description", "Actions"]} data={tableData} />

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
            title={selectedCategory ? "Update Category" : "Create Category"}
            initialData={initialData}
            onSubmit={handleSubmit}
            fields={[
              { name: "name", label: "Name", type: "text", required: true },
              { name: "description", label: "Description", type: "text", required: false },
            ]}
            validate={(form) => {
              const e = {};
              if (!form.name?.trim()) e.name = "Category name is required";
              return e;
            }}
          />
        </Modal>
      )}
    </div>
  );
}
