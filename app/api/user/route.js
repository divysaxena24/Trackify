import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createSupabaseClient();

    // Get the session to verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Return user information
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      }
    });
  } catch (error) {
    console.error("Error in user API:", error);

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}