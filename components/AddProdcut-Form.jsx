"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {AuthModal} from "./AuthModal"
import { AddProduct } from "@/app/auth/callback/actions";
import {toast} from 'sonner';

const AddProductForm = ({ user }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!user){
      setShowAuthModal(true);
      return
    }
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("url", url);

    const result = await AddProduct(formData);

    if(result.error){
      toast.error("Error: " + result.error);
      setMessage("Error: " + result.error);
    }else{
      toast.success("Success: " + result.message);
      setMessage("Success: " + result.message);
      setUrl("");
    }

    setLoading(false);


  };

  return (
    <>
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste product URL (Amazon, Flipkart, etc.)"
          className="h-12 text-base px-4 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          required
          disabled={loading}
        />

        <Button
          disabled={loading}
          className="h-12 px-6 rounded-lg bg-black hover:bg-gray-800 shadow-sm"
        >
          {loading ? "Processing..." : "Track Price"}
        </Button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-center ${
          message.includes("Error")
            ? "bg-red-100 text-red-700 border border-red-200"
            : "bg-green-100 text-green-700 border border-green-200"
        }`}>
          {message}
        </div>
      )}
    </form>

    {/* Auth modal can be implemented here if needed */}
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
  </>
  );
};

export default AddProductForm;