import React from 'react';
import { IoClose } from "react-icons/io5";

const FeedbackDetailModal = ({ feedback, onClose }) => {
    // Don't render anything if there's no feedback selected
    if (!feedback) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl relative">
                <h3 className="text-xl font-bold mb-4">Feedback Details</h3>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                >
                    <IoClose size={24} />
                </button>
                <div className="bg-gray-50 p-4 rounded-md mt-2">
                    {/* whitespace-pre-wrap ensures that line breaks in the feedback are displayed */}
                    <p className="text-gray-800 text-lg whitespace-pre-wrap">"{feedback.feedbackText}"</p>
                </div>
                <div className="text-right text-sm text-gray-500 mt-4">
                    <p className="font-semibold">{feedback.studentName}</p>
                    <p>{new Date(feedback.createdAt).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default FeedbackDetailModal;