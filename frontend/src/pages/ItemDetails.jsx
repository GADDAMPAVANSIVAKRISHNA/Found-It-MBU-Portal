// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { apiFetch } from "../utils/api";
// import imageCompression from "browser-image-compression";
// import { auth } from "../lib/firebase";

// const ItemDetails = () => {
//   const { id } = useParams();
//   const { isAuthenticated } = useAuth();
//   const navigate = useNavigate();

//   const [item, setItem] = useState(null);
//   const [showClaim, setShowClaim] = useState(false);

//   const [claimForm, setClaimForm] = useState({
//     studentId: "",
//     proofDescription: "",
//     proofImageFile: null,
//   });

//   const [userInfo, setUserInfo] = useState({
//     name: "",
//     email: "",
//     contactNumber: "",
//   });

//   useEffect(() => {
//     loadItem();
//   }, [id]);

//   const loadItem = async () => {
//     try {
//       const res = await apiFetch(`/api/items/${id}`, { method: "GET" });

//       if (!res.ok) {
//         console.log(res);
//         return;
//       }

//       setItem(res.data);

//       const u = auth?.currentUser;
//       if (u) {
//         setUserInfo({
//           name: u.displayName || "",
//           email: u.email || "",
//           contactNumber: "",
//         });
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const submitClaim = async (e) => {
//     e.preventDefault();

//     if (!isAuthenticated) {
//       alert("Please login to claim items");
//       navigate("/login");
//       return;
//     }

//     try {
//       const u = auth.currentUser;

//       const fd = new FormData();
//       fd.append("itemId", item._id);
//       fd.append("type", item.type?.toLowerCase());
//       fd.append("name", userInfo.name);
//       fd.append("email", userInfo.email);
//       fd.append("studentId", claimForm.studentId);
//       fd.append("contactNumber", userInfo.contactNumber || "");
//       fd.append("proofDescription", claimForm.proofDescription);
//       fd.append("userId", u.uid);

//       if (claimForm.proofImageFile) {
//         const compressed = await imageCompression(claimForm.proofImageFile, {
//           maxWidthOrHeight: 800,
//           maxSizeMB: 1.2,
//           useWebWorker: true,
//         });

//         fd.append(
//           "proofImage",
//           new File([compressed], claimForm.proofImageFile.name, {
//             type: compressed.type,
//           })
//         );
//       }

//       const res = await apiFetch("/api/claims", {
//         method: "POST",
//         body: fd,
//       });

//       if (!res.ok) {
//         return alert(res.data?.message || "Failed to submit claim");
//       }

//       alert("Claim submitted! You will be notified upon review.");
//       navigate("/dashboard");
//     } catch (err) {
//       console.error(err);
//       alert("Error submitting claim");
//     }
//   };

//   if (!item) return <div className="text-center py-16 text-xs sm:text-sm lg:text-base">Loading...</div>;

//   return (
//     <div className="w-screen overflow-x-hidden max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
//       <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
//           {/* Item Image */}
//           <div>
//             {item.imageUrl ? (
//               <img
//                 src={item.imageUrl}
//                 className="w-full h-64 sm:h-72 lg:h-96 object-cover rounded-lg"
//               />
//             ) : (
//               <div className="w-full h-64 sm:h-72 lg:h-96 bg-gray-200 rounded-lg flex items-center justify-center">
//                 <span className="text-gray-500 text-sm sm:text-base lg:text-xl">No Image</span>
//               </div>
//             )}
//           </div>

//           {/* Item Info */}
//           <div className="flex flex-col justify-between">
//             <div>
//               <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 break-words">{item.title}</h1>

//               <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
//                 <div className="flex justify-between text-xs sm:text-sm lg:text-base">
//                   <span className="text-gray-600">Type:</span>
//                   <span
//                     className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
//                       item.type === "Lost"
//                         ? "bg-red-100 text-red-700"
//                         : "bg-green-100 text-green-700"
//                     }`}
//                   >
//                     {item.type}
//                   </span>
//                 </div>

//                 <div className="flex justify-between text-xs sm:text-sm lg:text-base">
//                   <span className="text-gray-600">Status:</span>
//                   <span
//                     className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
//                       item.status === "Active"
//                         ? "bg-blue-100 text-blue-700"
//                         : "bg-gray-100 text-gray-700"
//                     }`}
//                   >
//                     {item.status}
//                   </span>
//                 </div>

//                 <div className="flex justify-between text-xs sm:text-sm lg:text-base">
//                   <span className="text-gray-600">Category:</span>
//                   <strong className="break-words text-right">{item.category}</strong>
//                 </div>

//                 <div className="flex justify-between text-xs sm:text-sm lg:text-base">
//                   <span className="text-gray-600">Subcategory:</span>
//                   <strong className="break-words text-right">{item.subcategory || "—"}</strong>
//                 </div>

//                 <div className="flex justify-between text-xs sm:text-sm lg:text-base">
//                   <span className="text-gray-600">Location:</span>
//                   <strong className="break-words text-right">{item.location}</strong>
//                 </div>

//                 <div className="flex justify-between text-xs sm:text-sm lg:text-base">
//                   <span className="text-gray-600">Date:</span>
//                   <strong>
//                     {new Date(item.date).toLocaleDateString("en-IN")}
//                   </strong>
//                 </div>
//               </div>

//               <div className="mb-4 sm:mb-6">
//                 <h3 className="font-bold mb-2 text-sm sm:text-base lg:text-lg">Description:</h3>
//                 <p className="text-gray-700 text-xs sm:text-sm lg:text-base break-words">{item.description}</p>
//               </div>

//               {/* Contact */}
//               <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
//                 <h3 className="font-bold mb-2 text-sm sm:text-base lg:text-lg">Contact:</h3>
//                 <p className="text-xs sm:text-sm lg:text-base">
//                   <strong>Name:</strong> <span className="break-all">{item.userName || ""}</span>
//                 </p>
//                 <p className="text-xs sm:text-sm lg:text-base">
//                   <strong>Phone:</strong> <span className="break-all">{item.userContact || ""}</span>
//                 </p>
//                 <p className="text-xs sm:text-sm lg:text-base">
//                   <strong>Email:</strong> <span className="break-all">{item.userEmail || ""}</span>
//                 </p>
//               </div>
//             </div>

//             {item.type === "Found" && item.status === "Active" && (
//               <button
//                 onClick={() => setShowClaim(true)}
//                 className="w-full bg-blue-600 text-white py-2.5 sm:py-3 lg:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-700 transition"
//               >
//                 Claim Item
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* CLAIM MODAL */}
//       {showClaim && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
//           <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-sm sm:max-w-md lg:max-w-lg p-4 sm:p-6 my-auto">
//             <div className="flex justify-between items-center mb-3 sm:mb-4">
//               <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">Claim Item</h3>
//               <button onClick={() => setShowClaim(false)} className="text-gray-600 text-xl">
//                 ✕
//               </button>
//             </div>

//             <form onSubmit={submitClaim}>
//               <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-xs sm:text-sm font-semibold mb-1">Name</label>
//                   <input
//                     className="w-full border rounded-lg px-3 py-2"
//                     value={userInfo.name}
//                     readOnly
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs sm:text-sm font-semibold mb-1">Email</label>
//                   <input
//                     className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm"
//                     value={userInfo.email}
//                     readOnly
//                   />
//                 </div>
//               </div>

//               <div className="mb-3">
//                 <label className="block text-xs sm:text-sm font-semibold mb-1">Contact Number</label>
//                 <input
//                   className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm"
//                   value={userInfo.contactNumber}
//                   readOnly
//                 />
//               </div>

//               <div className="mb-3">
//                 <label className="block text-xs sm:text-sm font-semibold mb-1">Student ID</label>
//                 <input
//                   className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm"
//                   value={claimForm.studentId}
//                   onChange={(e) =>
//                     setClaimForm({
//                       ...claimForm,
//                       studentId: e.target.value,
//                     })
//                   }
//                   required
//                 />
//               </div>

//               <div className="mb-3">
//                 <label className="block text-xs sm:text-sm font-semibold mb-1">Proof of Ownership</label>
//                 <textarea
//                   className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm"
//                   rows={3}
//                   value={claimForm.proofDescription}
//                   onChange={(e) =>
//                     setClaimForm({
//                       ...claimForm,
//                       proofDescription: e.target.value,
//                     })
//                   }
//                   required
//                 />
//               </div>

//               <div className="mb-3">
//                 <label className="block text-xs sm:text-sm font-semibold mb-1">Optional Proof Image</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   className="w-full text-xs sm:text-sm"
//                   onChange={(e) =>
//                     setClaimForm({
//                       ...claimForm,
//                       proofImageFile: e.target.files?.[0] || null,
//                     })
//                   }
//                 />
//               </div>

//               <button
//                 type="submit"
//                 className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base"
//               >
//                 Submit Claim
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ItemDetails;


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import imageCompression from "browser-image-compression";
import { auth } from "../lib/firebase";
import ConnectModal from "../components/ConnectModal";

const ItemDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

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

  const handleConnectClick = () => {
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
    setShowConnectModal(true);
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
              {(item.type === "Lost" || isOwner) && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold mb-2 text-sm sm:text-base lg:text-lg">Contact:</h3>

                  <p className="text-xs sm:text-sm lg:text-base">
                    <strong>Roll Number:</strong>{" "}
                    {(item.userEmail && item.userEmail.split("@")[0]) || "—"}
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

              {item.type === "Found" && !isOwner && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                  <p className="font-semibold mb-1">🔒 Private Contact</p>
                  <p>To protect privacy, contact details are hidden. Use the button below to securely connect with the finder.</p>
                </div>
              )}

            </div>

            {item.type === "Found" && item.status === "Active" && !isOwner && (
              <button
                onClick={handleConnectClick}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 lg:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <span>💬</span> Connect Securely
              </button>
            )}
          </div>
        </div>
      </div>

      {showConnectModal && (
        <ConnectModal
          item={item}
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => {
            // Optional: Reload item or navigate
          }}
        />
      )}
    </div>
  );
};

export default ItemDetails;
