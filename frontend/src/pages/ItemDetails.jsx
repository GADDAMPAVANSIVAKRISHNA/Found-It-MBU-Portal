import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import imageCompression from "browser-image-compression";
import { auth } from "../lib/firebase";

const ItemDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [showClaim, setShowClaim] = useState(false);

  const [claimForm, setClaimForm] = useState({
    studentId: "",
    proofDescription: "",
    proofImageFile: null,
  });

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    contactNumber: "",
  });

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const res = await apiFetch(`/api/items/${id}`, { method: "GET" });

      if (!res.ok) {
        console.log(res);
        return;
      }

      setItem(res.data);

      const u = auth?.currentUser;
      if (u) {
        setUserInfo({
          name: u.displayName || "",
          email: u.email || "",
          contactNumber: "",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Please login to claim items");
      navigate("/login");
      return;
    }

    try {
      const u = auth.currentUser;

      const fd = new FormData();
      fd.append("itemId", item._id);
      fd.append("type", item.type?.toLowerCase());
      fd.append("name", userInfo.name);
      fd.append("email", userInfo.email);
      fd.append("studentId", claimForm.studentId);
      fd.append("contactNumber", userInfo.contactNumber || "");
      fd.append("proofDescription", claimForm.proofDescription);
      fd.append("userId", u.uid);

      if (claimForm.proofImageFile) {
        const compressed = await imageCompression(claimForm.proofImageFile, {
          maxWidthOrHeight: 800,
          maxSizeMB: 1.2,
          useWebWorker: true,
        });

        fd.append(
          "proofImage",
          new File([compressed], claimForm.proofImageFile.name, {
            type: compressed.type,
          })
        );
      }

      const res = await apiFetch("/api/claims", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        return alert(res.data?.message || "Failed to submit claim");
      }

      alert("Claim submitted! You will be notified upon review.");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error submitting claim");
    }
  };

  if (!item) return <div className="text-center py-16">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Item Image */}
          <div>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-xl">No Image</span>
              </div>
            )}
          </div>

          {/* Item Info */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{item.title}</h1>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span
                  className={`px-3 py-1 rounded-full ${
                    item.type === "Lost"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.type}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full ${
                    item.status === "Active"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <strong>{item.category}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Subcategory:</span>
                <strong>{item.subcategory || "—"}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <strong>{item.location}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <strong>
                  {new Date(item.date).toLocaleDateString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2">Description:</h3>
              <p className="text-gray-700">{item.description}</p>
            </div>

            {/* Contact */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Contact:</h3>
              <p>
                <strong>Name:</strong> {item.userName || ""}
              </p>
              <p>
                <strong>Phone:</strong> {item.userContact || ""}
              </p>
              <p>
                <strong>Email:</strong> {item.userEmail || ""}
              </p>
            </div>

            {item.type === "Found" && item.status === "Active" && (
              <button
                onClick={() => setShowClaim(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700"
              >
                Claim Item
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CLAIM MODAL */}
      {showClaim && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Claim Item</h3>
              <button onClick={() => setShowClaim(false)} className="text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={submitClaim}>
              <div className="mb-3 grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={userInfo.name}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={userInfo.email}
                    readOnly
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm mb-1">Contact Number</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={userInfo.contactNumber}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm mb-1">Student ID</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={claimForm.studentId}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      studentId: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm mb-1">Proof of Ownership</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={4}
                  value={claimForm.proofDescription}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      proofDescription: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-1">Optional Proof Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      proofImageFile: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold"
              >
                Submit Claim
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;
