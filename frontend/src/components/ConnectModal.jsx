import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MESSAGE_TEMPLATES = [
    "This item belongs to me",
    "I can verify ownership",
    "Please review my claim",
    "Requesting to connect regarding this item"
];

const ConnectModal = ({ item, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { token, user } = useAuth();
    const [formData, setFormData] = useState({
        templateMessage: '',
        color: '',
        mark: '',
        location: ''
    });

    const isOwnItem = (() => {
        if (!user || !item) return false;
        const possibleUserIds = [user._id, user.uid, user.firebaseUid, user.id].filter(Boolean).map(String);
        return possibleUserIds.includes(String(item.userId));
    })();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.templateMessage) return toast.error("Please select a message");
        if (!formData.color || !formData.mark || !formData.location) return toast.error("Please fill all verification details");

        if (isOwnItem) {
            toast.error("You cannot contact your own item.");
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('/api/connections/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    itemId: item._id,
                    verification: {
                        color: formData.color,
                        mark: formData.mark,
                        location: formData.location
                    },
                    templateMessage: formData.templateMessage
                })
            });

            if (res.ok) {
                toast.success("Request sent successfully!");
                onSuccess && onSuccess();
                onClose();
            } else {
                const serverMsg = res.data?.message || res.data?.error || "Failed to send request";
                toast.error(serverMsg);
            }
        } catch (error) {
            console.error(error);
            // If API returned JSON error it should be in error.message or error
            toast.error(error?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">✕</button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2">Connect Securely</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Contact the finder without sharing personal details.
                        Step {step} of 2
                    </p>

                    {step === 1 ? (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Select a Message</h3>
                            <div className="grid gap-3">
                                {MESSAGE_TEMPLATES.map((msg, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setFormData({ ...formData, templateMessage: msg })}
                                        className={`p-3 text-left border rounded-lg transition-all ${formData.templateMessage === msg
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-600'
                                                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        {msg}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    if (formData.templateMessage) setStep(2);
                                    else toast.error("Please select a message");
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mt-4"
                            >
                                Next: Verification
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Verify Ownership</h3>
                            <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200 mb-2">
                                🔒 Only these details will be sent initially. No contact info.
                            </p>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Item Color</label>
                                <input
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                    placeholder="e.g. Red, Black"
                                    className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Unique Mark / Description</label>
                                <textarea
                                    name="mark"
                                    value={formData.mark}
                                    onChange={handleChange}
                                    placeholder="e.g. Scratch on back, sticker..."
                                    rows="2"
                                    className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Lost Location (Approx)</label>
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Library 2nd Floor"
                                    className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || isOwnItem}
                                    className="w-2/3 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                    ) : isOwnItem ? (
                                        "You cannot contact your own item."
                                    ) : (
                                        "Send Request"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectModal;
