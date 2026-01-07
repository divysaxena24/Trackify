"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const GetStartedButton = () => {
  const handleClick = () => {
    // Trigger the login modal by clicking the header login button
    const loginButton = document.querySelector('button[data-testid="login-button"]');
    if (loginButton) {
      loginButton.click();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="default"
      size="lg"
      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
    >
      Get Started
    </Button>
  );
};

export default GetStartedButton;