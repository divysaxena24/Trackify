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
  const [error, setError] = useState("");

  // Advanced URL validation function
  const validateUrl = (url) => {
    if (!url) {
      return "URL is required";
    }

    // Check if it's a valid URL format
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      if (!validProtocols.includes(urlObj.protocol)) {
        return "URL must use HTTP or HTTPS protocol";
      }
    } catch (e) {
      return "Please enter a valid URL";
    }

    // Check if it's a supported e-commerce site
    const supportedDomains = [
      'amazon.com', 'amazon.', 'flipkart.com', 'flipkart.',
      'ebay.com', 'ebay.', 'bestbuy.com', 'bestbuy.',
      'walmart.com', 'walmart.', 'target.com', 'target.',
      'newegg.com', 'newegg.'
    ];

    const isSupported = supportedDomains.some(domain =>
      url.toLowerCase().includes(domain)
    );

    if (!isSupported) {
      return "Currently only Amazon, Flipkart, eBay, Best Buy, Walmart, Target, and Newegg URLs are supported";
    }

    // Check for common URL patterns that might not be product pages
    const nonProductPatterns = [
      /\/cart/,
      /\/checkout/,
      /\/account/,
      /\/orders/,
      /\/wishlist/,
      /\/search\?/,
      /\/s\?/
    ];

    if (nonProductPatterns.some(pattern => pattern.test(url))) {
      return "Please enter a direct product page URL";
    }

    return null; // Valid URL
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!user){
      setShowAuthModal(true);
      return
    }

    // Run validation
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setError(""); // Clear any previous error
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("url", url);

    const result = await AddProduct(formData);

    if(result.error){
      // Create a more user-friendly error message
      let userFriendlyError = result.error;
      if (result.error.includes("Could not extract product name and price")) {
        userFriendlyError = "Could not extract product information. Please check the URL and try again.";
      } else if (result.error.includes("Could not extract product name")) {
        userFriendlyError = "Could not extract product name. Please check the URL and try again.";
      } else if (result.error.includes("Could not extract product price")) {
        userFriendlyError = "Could not extract product price. Please check the URL and try again.";
      } else if (result.error.includes("Failed to scrape product data")) {
        userFriendlyError = "Failed to scrape product data. Please check the URL and try again.";
      } else if (result.error.includes("Site not supported")) {
        userFriendlyError = "This website is not supported yet. Please try a different URL.";
      } else if (result.error.includes("URL and try again")) {
        // Keep the existing user-friendly messages
        userFriendlyError = result.error;
      }

      toast.error("Error: " + userFriendlyError);
      setMessage("Error: " + userFriendlyError);
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
        <div className="flex-grow">
          <Input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              // Clear error when user starts typing
              if (error) setError("");
            }}
            placeholder="Paste product URL (Amazon, Flipkart, etc.)"
            className={`h-12 text-base px-4 rounded-lg border ${
              error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            } shadow-sm`}
            disabled={loading}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

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