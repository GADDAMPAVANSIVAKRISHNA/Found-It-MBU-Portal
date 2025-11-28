import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { toast } from "react-hot-toast";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contactItem, setContactItem] = useState(null);

  const [filters, setFilters] = useState({
    category: "",
    status: "",
    q: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchItems();
  }, [page, filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);

      // Convert UI status to backend status
      const statusFormatted =
        filters.status === "unclaimed"
          ? "Active"
          : filters.status === ""
          ? ""
          : filters.status.charAt(0).toUpperCase() +
            filters.status.slice(1);

      const query = new URLSearchParams({
        category: filters.category,
        status: statusFormatted,
        q: filters.q,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page,
        limit: 20,
      }).toString();

      const res = await apiFetch(`/api/items?${query}`, { method: "GET" });

      if (!res.ok) {
        console.log(res);
        toast.error("Failed to load items");
        setItems([]);
        return;
      }

      const data = res.data;

      const itemsArray = Array.isArray(data)
        ? data
        : data.items || [];

      setItems(itemsArray);
      setTotalPages(data.totalPages || 1);

    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Failed to load items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });

    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Lost & Found Items</h1>

      {/* Filters */}
      <div className="mb-8 flex gap-4 flex-wrap">
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Accessories">Accessories</option>
          <option value="Documents">Documents</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
          <option value="Others">Others</option>
        </select>

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="unclaimed">Unclaimed</option>
          <option value="claimed">Claimed</option>
          <option value="returned">Returned</option>
        </select>

        <input
          type="text"
          name="q"
          placeholder="Search..."
          value={filters.q}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-lg flex-1 min-w-xs"
        />

        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-lg"
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {/* NO ITEMS */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-600">No items match your filters.</p>
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <p className="text-gray-400 text-center">No Image</p>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Category + Status */}
                  <div className="mb-3 flex gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                      {item.category}
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        (item.status || "").toLowerCase() === "claimed"
                          ? "bg-yellow-100 text-yellow-800"
                          : (item.status || "").toLowerCase() === "returned"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status
                        ? item.status.toLowerCase() === "active"
                          ? "Unclaimed"
                          : item.status
                        : "Unclaimed"}
                    </span>
                  </div>

                  {/* Location + Date */}
                  <div className="text-sm text-gray-600 mb-4 space-y-1">
                    <p>📍 {item.location || item.approximateLocation}</p>
                    <p>
                      📅{" "}
                      {new Date(
                        item.date || item.dateFound || item.dateLost
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {item.description}
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Link
                      to={`/item/${item._id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-center text-sm"
                    >
                      View Details
                    </Link>

                    <button
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm"
                      onClick={() => setContactItem(item)}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                ← Previous
              </button>

              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* CONTACT MODAL */}
      {contactItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Contact Details</h3>
              <button onClick={() => setContactItem(null)}>✕</button>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {contactItem.userName || "N/A"}
              </p>
              <p>
                <strong>Mobile:</strong> {contactItem.userContact || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {contactItem.userEmail || "N/A"}
              </p>

              <hr className="my-2" />

              <p>
                <strong>Item:</strong> {contactItem.title}
              </p>
              <p className="text-gray-600">{contactItem.description}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to={`/item/${contactItem._id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                View Details
              </Link>
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setContactItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
