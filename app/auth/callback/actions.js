"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scrapeProduct } from "@/lib/firecrawl";

/* ---------------- SIGN OUT ---------------- */

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/");
  redirect("/");
}

/* ---------------- ADD PRODUCT ---------------- */

export async function AddProduct(formData) {
  const rawUrl = formData.get("url");

  if (!rawUrl) {
    return { error: "URL is required" };
  }

  // normalize URL (important for Amazon, Flipkart etc.)
  const url = rawUrl.split("?")[0];

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "User not authenticated" };
    }

    // scrape product
    const productData = await scrapeProduct(url);

    if (!productData) {
      return { error: "Unable to scrape product. Site not supported." };
    }

    if (!productData.productName || !productData.currentPrice) {
      return {
        error:
          "Failed to extract product data. Please check the URL and try again.",
      };
    }

    // safely parse price
    const newPrice = Number(
      String(productData.currentPrice).replace(/[^0-9.]/g, "")
    );

    if (Number.isNaN(newPrice)) {
      return { error: "Invalid price detected" };
    }

    const currency = productData.currencyCode || "USD";

    // check if product already exists (SAFE)
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, current_price")
      .eq("user_id", user.id)
      .eq("url", url)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const isUpdate = !!existingProduct;

    // upsert product
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          user_id: user.id,
          url,
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

    // add price history ONLY if price changed or new product
    const shouldAddHistory =
      !isUpdate ||
      (existingProduct && existingProduct.current_price !== newPrice);

    if (shouldAddHistory) {
      await supabase.from("price_history").insert({
        product_id: product.id,
        price: newPrice,
        currency,
        checked_at: new Date().toISOString(),
      });
    }

    revalidatePath("/");

    return {
      success: true,
      product,
      message: isUpdate
        ? "Product updated successfully"
        : "Product added successfully",
    };
  } catch (error) {
    console.error("Error adding product:", error);

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "An unexpected error occurred" };
  }
}

/* ---------------- DELETE PRODUCT ---------------- */

export async function DeleteProduct(productId) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "User not authenticated" };

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", user.id); // security check 🛡️

    if (error) throw error;

    revalidatePath("/");
    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Error deleting product:", error);

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Error deleting product" };
  }
}

/* ---------------- GET PRODUCTS ---------------- */

export async function getProducts() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "User not authenticated" };

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { products };
  } catch (error) {
    console.error("Error fetching products:", error);

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Error fetching products" };
  }
}

/* ---------------- GET PRICE HISTORY ---------------- */

export async function getPriceHistory(productId) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "User not authenticated" };

    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    if (error) throw error;

    return { data: data ?? [] };
  } catch (error) {
    console.error("Error fetching price history:", error);

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Error fetching price history" };
  }
}
