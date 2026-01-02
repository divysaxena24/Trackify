"use client"
import React from 'react'
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useState } from 'react';
import { AuthModal } from '../AuthModal';
import { signOutClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AuthButton = ({ user }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if(user){
        return (
            <>
                <Button
                variant="ghost"
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                onClick={() => setShowLogoutConfirm(true)}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                </Button>
                
                <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Are you sure you want to log out?</DialogTitle>
                            <DialogDescription>
                                You will be signed out of your account and redirected to the home page.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                            <Button
                              onClick={async () => {
                                await signOutClient();
                                setShowLogoutConfirm(false);
                              }}
                              variant="destructive"
                            >
                              Log Out
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

  return (
    <>
        <Button onClick={() => setShowAuthModal(true)} variant="default" size="lg" className= "bg-black hover:bg-gray-800 shadow-sm">
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export default AuthButton