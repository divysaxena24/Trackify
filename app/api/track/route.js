import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createSupabaseClient();

    // Get the session to verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Normalize URL
    const normalizedUrl = url.split("?")[0];

    // Import scraper
    const { scrapeProduct } = await import("@/lib/firecrawl");

    // Scrape product
    const productData = await scrapeProduct(normalizedUrl);

    if (!productData) {
      return NextResponse.json(
        { error: "Unable to scrape product. Site not supported." },
        { status: 400 }
      );
    }

    if (!productData.productName || !productData.currentPrice) {
      return NextResponse.json(
        { error: "Failed to extract product data. Please check the URL and try again." },
        { status: 400 }
      );
    }

    // Safely parse price
    const newPrice = Number(
      String(productData.currentPrice).replace(/[^0-9.]/g, "")
    );

    if (Number.isNaN(newPrice)) {
      return NextResponse.json({ error: "Invalid price detected" }, { status: 400 });
    }

    const currency = productData.currencyCode || "USD";

    // Check if product already exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, current_price")
      .eq("user_id", user.id)
      .eq("url", normalizedUrl)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const isUpdate = !!existingProduct;

    // Upsert product
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          user_id: user.id,
          url: normalizedUrl,
          name: productData.productName,
          image_url: productData.productImageUrl || null,
          current_price: newPrice,
          currency,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,url",
        }
      )
      .select()
      .single();

    if (error) throw error;

    // Add price history ONLY if price changed or new product
    const shouldAddHistory =
      !isUpdate ||
      (existingProduct && existingProduct.current_price !== newPrice);

    if (shouldAddHistory) {
      const priceToStore =
        isUpdate && existingProduct ? existingProduct.current_price : newPrice;

      await supabase.from("price_history").insert({
        product_id: product.id,
        price: priceToStore,
        currency,
        checked_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      product,
      message: isUpdate
        ? "Product updated successfully"
        : "Product added successfully",
    });
  } catch (error) {
    console.error("Error in track API:", error);

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      { error: error.message || "Error fetching products" },
      { status: 500 }
    );
  }
}
