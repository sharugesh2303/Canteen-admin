import React from 'react';
import { IoClose } from 'react-icons/io5';

const ItemDetailsModal = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">{item.name} Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IoClose size={24} />
          </button>
        </div>
        <div className="mt-2">
          <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-48 object-cover rounded-md mb-4"/>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Price:</span> ₹{item.price.toFixed(2)}</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Category:</span> {item.category}</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Current Stock:</span> {item.stock}</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Sold Today:</span> {item.soldToday}</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;