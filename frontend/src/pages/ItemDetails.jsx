import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import { toast } from "react-hot-toast";
import { auth } from "../lib/firebase"; // Ensure auth is imported if used

const ItemDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectClick = async () => {
    if (!isAuthenticated) {
      alert("Please login to connect");
      navigate("/login");
      return;
    }
    // Prevent owner from connecting to own item
    if (user?.uid === item.userId) {
      alert("You cannot connect to your own item");
      return;
    }
    
    try {
      const res = await apiFetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item._id, ownerId: item.userId })
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

  if (!item)
    return (
      <div className="text-center py-16 text-xs sm:text-sm lg:text-base">
        Loading...
      </div>
    );

  const isOwner = user?.uid === item.userId;

  return (
    <div className="w-screen overflow-x-hidden max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

          <div>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                className="w-full h-64 sm:h-72 lg:h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 sm:h-72 lg:h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm sm:text-base lg:text-xl">
                  No Image
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 break-words">
                {item.title}
              </h1>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">

                <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                  <span className="text-gray-600">Type:</span>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${item.type === "Lost"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                      }`}
                  >
                    {item.type}
                  </span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                  <span className="text-gray-600">Category:</span>
                  <strong className="break-words text-right">
                    {item.category}
                  </strong>
                </div>

                <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                  <span className="text-gray-600">Subcategory:</span>
                  <strong className="break-words text-right">
                    {item.subcategory || "—"}
                  </strong>
                </div>

                <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                  <span className="text-gray-600">Location:</span>
                  <strong className="break-words text-right">
                    {item.location}
                  </strong>
                </div>

                <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                  <span className="text-gray-600">Date:</span>
                  <strong>
                    {new Date(item.date).toLocaleDateString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <h3 className="font-bold mb-2 text-sm sm:text-base lg:text-lg">
                  Description:
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm lg:text-base break-words">
                  {item.description}
                </p>
              </div>

              {/* CONTACT BLOCK - Hidden for Found items unless Owner */}
              {((item.itemType === "Lost" || item.type === "Lost") || isOwner) && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold mb-2 text-sm sm:text-base lg:text-lg">Contact:</h3>

                  <p className="text-xs sm:text-sm lg:text-base">
                    <strong>Reported By:</strong>{" "}
                    {(item.userName) || "—"}
                  </p>

                  <p className="text-xs sm:text-sm lg:text-base">
                    <strong>Phone:</strong>{" "}
                    <span className="break-all">{item.userContact || ""}</span>
                  </p>

                  <p className="text-xs sm:text-sm lg:text-base">
                    <strong>Email:</strong>{" "}
                    <span className="break-all">{item.userEmail || ""}</span>
                  </p>
                </div>
              )}

              {(item.itemType === "Found" || item.type === "Found") && !isOwner && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                  <p className="font-semibold mb-1">🔒 Private Contact</p>
                  <p>To protect privacy, contact details are hidden. Use the button below to securely connect with the finder.</p>
                </div>
              )}

            </div>

            {(item.itemType === "Found" || item.type === "Found") && item.status === "Active" && !isOwner && (
              <button
                onClick={handleConnectClick}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 lg:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-700 transition"
              >
                Connect to Claim
              </button>
            )}
            
            {(item.itemType === "Lost" || item.type === "Lost") && item.status === "Active" && !isOwner && (
               <button
                 onClick={handleConnectClick}
                 className="w-full bg-blue-600 text-white py-2.5 sm:py-3 lg:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-700 transition"
               >
                 I Found This
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
