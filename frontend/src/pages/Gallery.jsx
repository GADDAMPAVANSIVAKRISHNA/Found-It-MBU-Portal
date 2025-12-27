import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import ConnectModal from "../components/ConnectModal";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // For Lost items (to show contact details of owner to finder)
  const [contactItem, setContactItem] = useState(null);

  // For Found items (to show Secure Connect Modal)
  const [connectItem, setConnectItem] = useState(null);

  const { user } = useAuth();


  const [localSearch, setLocalSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    q: "",
    startDate: "",
    endDate: "",
  });

  const handleSearchSubmit = () => {
    setFilters((prev) => ({
      ...prev,
      q: localSearch
    }));
    setPage(1);
  };

  useEffect(() => {
    fetchItems();
  }, [page, filters]);



  const fetchItems = async () => {
    try {
      setLoading(true);

      // Build query string
      const params = new URLSearchParams({
        page,
        limit: 20,
      });
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.q) params.append('q', filters.q);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await apiFetch(`/api/items?${params.toString()}`, { method: "GET" });

      if (!res.ok) {
        console.log(res);
        toast.error("Failed to load items");
        setItems([]);
        setLoading(false);
        return;
      }

      const data = res.data;
      const itemsArray = Array.isArray(data.items) ? data.items : [];

      const withinRange = itemsArray.filter((it) => {
        const raw = it.date || it.dateFound || it.dateLost;
        const d = raw ? new Date(raw) : null;
        const s = filters.startDate ? new Date(filters.startDate) : null;
        const e = filters.endDate ? new Date(filters.endDate) : null;
        if (!d) return true;
        if (s && d < s) return false;
        if (e && d > e) return false;
        return true;
      });

      setItems(withinRange);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Failed to load items");
      setItems([]);
      setLoading(false);
    }
  };

  const handleConnect = (item) => {
    if (!user) {
      toast.error("Please login to connect");
      return;
    }

    // Identify if it's a found item or lost item
    const isFound = item.itemType === "Found" || item.type === "Found" || String(item._id || "").startsWith("found_");

    if (isFound) {
      // Open Secure Connect Modal
      setConnectItem(item);
    } else {
      // Lost item: Show contact details (so finder can contact owner)
      setContactItem(item);
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
      <div className="w-screen overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="h-8 sm:h-10 w-2/3 max-w-sm bg-gray-200 rounded mb-6 sm:mb-8 animate-pulse"></div>

          {/* Filters Skeleton */}
          <div className="mb-6 sm:mb-8 flex gap-2 sm:gap-4 flex-wrap animate-pulse">
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 flex-1 bg-gray-200 rounded-lg min-w-[200px]"></div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse border border-gray-100">
                <div className="h-32 sm:h-40 lg:h-48 bg-gray-200"></div>
                <div className="p-2 sm:p-3 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 lg:mb-8">Browse Lost & Found Items</h1>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 flex gap-2 sm:gap-4 flex-wrap">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="px-2 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
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
            className="px-2 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="claimed">Claimed</option>
            <option value="returned">Returned</option>
          </select>

          <div className="relative flex-1 min-w-40 sm:min-w-48">
            <input
              type="text"
              name="q"
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-2 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm pr-10"
            />
            <button
              onClick={handleSearchSubmit}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
            >
              🔍
            </button>
          </div>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="px-2 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="px-2 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm"
          />
        </div>

        {/* NO ITEMS */}
        {items.length === 0 ? (
          <div className="text-center py-12 sm:py-16 lg:py-20 bg-gray-50 rounded-lg">
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">No items match your filters.</p>
          </div>
        ) : (
          <>
            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-32 sm:h-40 lg:h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-contain"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <p className="text-gray-400 text-center text-xs sm:text-sm">No Image</p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2 sm:p-3">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Category + Status */}
                    <div className="mb-2 sm:mb-3 flex gap-2 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        {item.category}
                      </span>

                      <span
                        className={`text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold ${item.itemType === "Found"
                          ? (item.status || "").toLowerCase() === "claimed"
                            ? "bg-yellow-100 text-yellow-800"
                            : (item.status || "").toLowerCase() === "returned"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          : "bg-orange-100 text-orange-800"
                          }`}
                      >
                        {item.itemType === "Found"
                          ? item.status?.toLowerCase() === "active"
                            ? "Unclaimed"
                            : item.status || "Unclaimed"
                          : "Lost"}
                      </span>
                    </div>

                    {/* Location + Date */}
                    <div className="text-xs sm:text-sm text-gray-600 mb-3 space-y-0.5">
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
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>

                    {/* Buttons - Hidden if owner */}
                    {user?.uid !== item.userId && (
                      <div className="flex">
                        <button
                          disabled={item.status === 'Frozen' || item.status === 'Claimed' || item.status === 'Returned'}
                          className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm transition flex items-center justify-center gap-1 ${item.status === 'Frozen' || item.status === 'Claimed' || item.status === 'Returned'
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          onClick={() => handleConnect(item)}
                        >
                          {item.status === 'Frozen' ? '❄️ Item Frozen' : 'Connect'}
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 sm:gap-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-200 rounded-lg disabled:opacity-50 text-xs sm:text-sm"
                >
                  ← Previous
                </button>

                <span className="text-gray-600 text-xs sm:text-sm">
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-200 rounded-lg disabled:opacity-50 text-xs sm:text-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* LEGACY CONTACT MODAL (Only for Lost items now) */}
        {contactItem && (() => {
          const contactEmail = contactItem?.userEmail || contactItem?.email || "";
          const emailLocal = (contactEmail || "").split("@")[0];
          const rollNumber = emailLocal || "";

          return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs sm:max-w-sm lg:max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto scrollbar-hide relative">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold">Owner Contact Details</h3>
                  <button onClick={() => setContactItem(null)} className="text-lg hover:text-gray-600">✕</button>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <p>
                    <strong>Roll Number:</strong> {rollNumber || contactItem.rollNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Mobile:</strong> {contactItem.userContact || contactItem.phone || contactItem.contactNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {contactEmail || "N/A"}
                  </p>

                  <hr className="my-2" />

                  <p>
                    <strong>Item:</strong> {contactItem.title}
                  </p>
                  <p className="text-gray-600">{contactItem.description}</p>
                </div>

                <div className="mt-4 flex pb-2">
                  <button
                    className="w-full px-3 sm:px-4 py-2 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition text-gray-700"
                    onClick={() => setContactItem(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SECURE CONNECT MODAL (For Found items) */}
        {connectItem && (
          <ConnectModal
            item={connectItem}
            onClose={() => setConnectItem(null)}
            onSuccess={(updatedItem) => {
              // Replace the specific item in local state so other users see it as frozen after claim
              setItems(prev => prev.map(it => (String(it._id) === String(updatedItem._id) ? updatedItem : it)));
              setConnectItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Gallery;
