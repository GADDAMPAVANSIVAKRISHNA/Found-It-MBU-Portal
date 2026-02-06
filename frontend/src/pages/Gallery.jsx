import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [connectItem, setConnectItem] = useState(null);

  // Active filters (triggers fetch)
  const [activeFilters, setActiveFilters] = useState({
    category: "",
    status: "",
    type: "",
    q: "",
    startDate: "",
    endDate: "",
  });

  // Draft filters (bound to UI)
  const [draftFilters, setDraftFilters] = useState({
    category: "",
    status: "",
    type: "",
    q: "",
    startDate: "",
    endDate: "",
  });

  // Remove auto-debounce search
  // Only update q in draft when typing (handled by generic handler now)

  const handleSearchSubmit = () => {
    setActiveFilters(draftFilters);
    setPage(1);
  };

  useEffect(() => {
    fetchItems();
  }, [page, activeFilters]);



  const fetchItems = async () => {
    try {
      setLoading(true);

      // Build query string
      const params = new URLSearchParams({
        page,
        limit: 20, // Fixed limit
        sort: 'recent' // Fixed sort
      });
      if (activeFilters.category) params.append('category', activeFilters.category);
      if (activeFilters.status) params.append('status', activeFilters.status);
      if (activeFilters.type) params.append('type', activeFilters.type);
      if (activeFilters.q) params.append('q', activeFilters.q);
      if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
      if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);

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
        const s = activeFilters.startDate ? new Date(activeFilters.startDate) : null;
        const e = activeFilters.endDate ? new Date(activeFilters.endDate) : null;
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

  const createChat = async (item) => {
    if (!user) {
      toast.error("Please login to connect");
      return;
    }

    try {
      if (!item.userId && !item.userEmail) {
        toast.error("This item has no registered owner to chat with.");
        return;
      }

      // Ensure we send a clean ID and correct type
      const rawId = item._id ? item._id.toString() : '';
      const cleanId = rawId.replace(/^(found_|lost_)/, '');

      const res = await apiFetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: cleanId,
          ownerId: item.userId,
          ownerEmail: item.userEmail, // Fallback for backend lookup
          itemType: item.itemType
        })
      });

      if (res.ok) {
        navigate(`/chat/${res.data.chat._id}`);
      } else {
        toast.error(res.data?.error || "Failed to connect");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating chat");
    }
  };

  const handleDraftChange = (e) => {
    const name = e.target.name;
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    setDraftFilters((prev) => ({
      ...prev,
      [name]: v,
    }));
  };

  const handleClaim = (item) => {
    if (!user) {
      toast.error('Please login to claim items');
      return;
    }
    setConnectItem(item);
  };

  const processClaim = async (item) => {
    // Close modal immediately
    setConnectItem(null);
    const loadingToast = toast.loading('Processing claim...');

    try {
      console.log('Freezing item:', item._id);
      const res = await apiFetch('/api/claim/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item._id })
      });

      console.log('Claim response:', res);
      toast.dismiss(loadingToast);

      if (res.ok) {
        toast.success('Item claimed successfully!');
        if (res.data.chatId) {
          console.log('Navigating to chat:', res.data.chatId);
          navigate(`/chat/${res.data.chatId}`);
        } else if (res.data.connectionRequestId) {
          console.log('Fallback to refresh (no chatId)');
          fetchItems();
          navigate('/messages');
        } else {
          console.warn('No chatId or connectionRequestId returned');
          fetchItems();
        }
      } else {
        toast.error(res.data?.error || 'Failed to claim item');
        fetchItems();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error(err);
      toast.error('Error claiming item');
    }
  };

  const handleConfirm = async (item) => {
    if (!user) return toast.error('Please login');
    try {
      const res = await apiFetch(`/api/items/${item._id}/confirm`, { method: 'PUT' });
      if (!res.ok) return toast.error(res.data?.message || 'Failed to confirm');
      toast.success('Confirmed — status updated');
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, status: (item.itemType === 'Found' ? 'Returned' : 'Resolved') } : i));
    } catch (e) { console.error(e); toast.error('Failed to confirm'); }
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
      {/* Contact Modal */}
      {connectItem && (
        <ContactModal
          item={connectItem}
          onClose={() => setConnectItem(null)}
          onChat={(item) => {
            // Close modal is handled in processClaim, but we can do it here too to be safe
            setConnectItem(null);

            if (item.itemType === 'Found') {
              // Confirm claim -> Freeze -> Chat
              processClaim(item);
            } else {
              // Lost item -> Just Chat (Notify Owner)
              createChat(item);
            }
          }}
        />
      )}
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 lg:mb-8">Browse Lost & Found Items</h1>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 flex gap-2 sm:gap-4 flex-wrap items-end">
          <select
            name="category"
            value={draftFilters.category}
            onChange={handleDraftChange}
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
            value={draftFilters.status}
            onChange={handleDraftChange}
            className="px-2 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="Unclaimed">Unclaimed</option>
            <option value="Claimed">Claimed</option>
            <option value="Verified">Verified</option>
            <option value="Returned">Returned</option>
            <option value="Resolved">Resolved</option>
            <option value="Expired">Expired</option>
          </select>

          <select
            name="type"
            value={draftFilters.type}
            onChange={handleDraftChange}
            className="px-2 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
          >
            <option value="">All Types</option>
            <option value="Found">Found</option>
            <option value="Lost">Lost</option>
          </select>

          <div className="flex flex-col">
            <label className="text-xs text-black mb-1 font-semibold">From Date</label>
            <input
              type="date"
              name="startDate"
              max={new Date().toISOString().split('T')[0]}
              value={draftFilters.startDate}
              onChange={handleDraftChange}
              className="px-2 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-black mb-1 font-semibold">To Date</label>
            <input
              type="date"
              name="endDate"
              max={new Date().toISOString().split('T')[0]}
              value={draftFilters.endDate}
              onChange={handleDraftChange}
              className="px-2 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm"
            />
          </div>

          <div className="relative flex-1 min-w-40 sm:min-w-48">
            <input
              type="text"
              name="q"
              placeholder="Search..."
              value={draftFilters.q}
              onChange={handleDraftChange}
              className="w-full px-2 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm pr-10"
            />
            <button
              onClick={handleSearchSubmit}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1"
              title="Search"
            >
              🔍
            </button>
          </div>

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
                    <div className="mb-2 sm:mb-3 flex gap-2 flex-wrap items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        {item.category}
                      </span>

                      {/* Status Badge */}
                      <div>
                        <StatusBadge status={(() => {
                          const s = item.status || '';
                          if (/^active$/i.test(s)) return 'Unclaimed';
                          if (/^frozen$/i.test(s)) return 'Under Review';
                          if (/^returned$/i.test(s)) return 'Returned';
                          if (/^claimed$/i.test(s)) return 'Claimed';
                          if (/^verified$/i.test(s)) return 'Verified';
                          if (/^resolved$/i.test(s)) return 'Resolved';
                          return s;
                        })()} />
                      </div>
                    </div>

                    {/* Location + Date */}
                    <div className="text-xs sm:text-sm text-gray-600 mb-3 space-y-0.5">
                      <p><span className="font-semibold">Location:</span> {item.location || item.approximateLocation}</p>
                      <p>
                        <span className="font-semibold">Date:</span>{" "}
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

                    {/* Action Buttons & Status Badges */}
                    <div className="flex w-full mt-2 flex-col gap-2">
                      {(() => {
                        const currentUserId = user ? String(user._id || user.uid || user.id || '') : '';
                        const itemUserId = String(item.userId || '');
                        const itemClaimedBy = String(item.claimedBy || '');

                        const isPoster = currentUserId && currentUserId === itemUserId;
                        const isResponder = currentUserId && currentUserId === itemClaimedBy;
                        const isReceiver = (item.itemType === 'Lost' && isPoster) || (item.itemType === 'Found' && isResponder);

                        const rawStatus = item.status || '';
                        const status = (() => {
                          if (/^active$/i.test(rawStatus)) return 'Unclaimed';
                          if (/^frozen$/i.test(rawStatus)) return 'Under Review';
                          if (/^returned$/i.test(rawStatus)) return 'Returned';
                          if (/^claimed$/i.test(rawStatus)) return 'Claimed';
                          if (/^verified$/i.test(rawStatus)) return 'Verified';
                          if (/^resolved$/i.test(rawStatus)) return 'Resolved';
                          return rawStatus;
                        })();

                        // Returned/Resolved - final state
                        if (status === 'Returned' || status === 'Resolved') {
                          return (
                            <span className="w-full px-3 py-2 rounded text-sm bg-gray-100 text-green-700 border border-gray-200 text-center font-semibold">
                              {status} ✓
                            </span>
                          );
                        }

                        // Claimed / Under Review
                        if (status === 'Claimed' || status === 'Under Review') {
                          if (isPoster || isResponder) {
                            const label = isPoster
                              ? (item.itemType === 'Lost' ? 'Message Finder' : 'Message Claimant')
                              : (item.itemType === 'Lost' ? 'Message Owner' : 'Message Finder');

                            return (
                              <div className="flex flex-col gap-2 w-full">
                                <button className="w-full px-3 py-2 rounded text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium transition shadow-sm flex items-center justify-center gap-2" onClick={() => createChat(item)}>
                                  ✉️ {label}
                                </button>
                                {isReceiver && (
                                  <button className="w-full px-3 py-2 rounded text-sm bg-green-600 hover:bg-green-700 text-white font-medium transition shadow-sm flex items-center justify-center gap-2" onClick={() => handleConfirm(item)}>
                                    ✅ I Received It
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return (
                            <span className="w-full px-3 py-2 rounded text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 text-center font-medium">
                              Already Claimed
                            </span>
                          );
                        }

                        // Default: available (Unclaimed / Active / Found)
                        if (isPoster) {
                          return (
                            <span className="w-full px-3 py-2 rounded text-sm bg-blue-50 text-blue-600 border border-blue-100 text-center font-medium">
                              Your Post
                            </span>
                          );
                        }

                        // For found items: Claim Item
                        if (item.itemType === 'Found') {
                          return (
                            <button className="w-full px-3 py-2 rounded text-sm bg-green-600 hover:bg-green-700 text-white font-medium transition shadow-sm flex items-center justify-center gap-2" onClick={() => handleClaim(item)}>
                              Claim Item
                            </button>
                          );
                        }

                        // For lost items: I Found This (contact owner)
                        return (
                          <button className="w-full px-3 py-2 rounded text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition shadow-sm flex items-center justify-center gap-2" onClick={() => handleClaim(item)}>
                            I Found This
                          </button>
                        );
                      })()}
                    </div>
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

        {/* LEGACY CONTACT MODAL & CONNECT MODAL REMOVED */}
      </div>
    </div>
  );
};



/* CONTACT MODAL */
const ContactModal = ({ item, onClose, onChat }) => {
  if (!item) return null;

  const rollNumber = item.rollNumber || (item.userEmail ? item.userEmail.split('@')[0] : 'N/A');
  const finderName = item.userName || 'Finder';

  const isFoundItem = item.itemType === 'Found';
  const title = isFoundItem ? 'Contact Finder' : 'Contact Owner';
  const subtitle = isFoundItem ? 'Item found by' : 'Item reported by';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle} {rollNumber}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
            <div className="bg-white p-2 rounded-md shadow-sm text-lg">🆔</div>
            <div className="text-left">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Roll Number</p>
              <p className="font-semibold text-gray-800">{rollNumber}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
            <div className="bg-white p-2 rounded-md shadow-sm text-lg">📧</div>
            <div className="text-left overflow-hidden">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Email Address</p>
              <p className="font-semibold text-gray-800 truncate" title={item.userEmail}>{item.userEmail || 'Hidden'}</p>
            </div>
          </div>
        </div>


        <div className="flex gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChat(item);
            }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>💬</span> Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
