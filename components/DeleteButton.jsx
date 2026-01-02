"use client";

import { useState } from 'react';
import { DeleteProduct } from "@/app/auth/callback/actions";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ productId }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowConfirmModal(false);

    try {
      // Call the server action directly
      await DeleteProduct(productId);
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    } finally {
      setIsDeleting(false);
    }
  };

  const openConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <button
        onClick={openConfirmModal}
        disabled={isDeleting}
        className="w-11 h-11 flex items-center justify-center bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
      >
        {isDeleting ? (
          <span className="text-xs">...</span>
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}