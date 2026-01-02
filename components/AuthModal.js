"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }
from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";


export function AuthModal({isOpen, onClose}) {
    const supabase = createClient();

const handleGoogleLogin = async () => {
  const { origin } = window.location;

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] flex flex-col items-center text-center">
            <DialogHeader className="w-full">
                <DialogTitle className="text-center">Welcome!</DialogTitle>
                <DialogDescription className="text-center">
                Sign in to unlock price tracking, smart alerts, and your saved products.
                </DialogDescription>

            

          </DialogHeader>
          {/* HERE sign up with Google button with google icon */}

            <div className="mt-4 flex flex-col gap-4">
                    <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5 mr-2"
                        >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.23 9.21 3.64l6.85-6.85C35.64 2.93 30.27 1 24 1 14.64 1 6.51 6.42 2.69 14.26l7.98 6.19C12.6 13.6 17.8 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.2 24.5c0-1.57-.14-3.09-.4-4.55H24v9h12.7c-.55 2.97-2.25 5.48-4.79 7.16l7.52 5.84C43.37 37.4 46.2 31.5 46.2 24.5z" />
                        <path fill="#FBBC04" d="M10.67 28.5c-.48-1.44-.74-2.97-.74-4.5s.26-3.06.74-4.5l-7.98-6.19C.93 16.06 0 20.02 0 24s.93 7.94 2.69 11.69l7.98-6.19z" />
                        <path fill="#34A853" d="M24 47c6.48 0 11.9-2.13 15.87-5.81l-7.52-5.84C30.33 36.37 27.35 37.5 24 37.5c-6.2 0-11.4-4.1-13.33-9.89l-7.98 6.19C6.51 41.58 14.64 47 24 47z" />
                        </svg>
                        Continue with Google
                    </Button>
            </div>

        </DialogContent>
    </Dialog>
  )
}
