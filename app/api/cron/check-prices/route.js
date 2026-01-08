import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/email";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    console.log(`Found ${products.length} products to check`);

    const results = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products) {
      try {
        const productData = await scrapeProduct(product.url);

        if (!productData || !productData.currentPrice) {
          console.error(`Failed to scrape product for URL: ${product.url}`);
          results.failed++;
          continue;
        }

        // Check if the price is available and valid
        if (productData.currentPrice.toLowerCase().includes('not available') ||
            productData.currentPrice.trim() === '' ||
            isNaN(parseFloat(productData.currentPrice.replace(/[^\d.-]/g, '')))) {
          console.error(`Price not available for product ${product.id}: ${productData.currentPrice}`);
          results.failed++;
          continue;
        }

        // Parse prices and validate them
        // Remove currency symbols and commas before parsing
        const cleanNewPrice = productData.currentPrice.replace(/[^\d.-]/g, '');
        const cleanOldPrice = product.current_price.toString().replace(/[^\d.-]/g, '');

        const newPrice = parseFloat(cleanNewPrice);
        const oldPrice = parseFloat(cleanOldPrice);

        if (isNaN(newPrice) || isNaN(oldPrice)) {
          console.error(`Invalid price data for product ${product.id}: oldPrice=${product.current_price} (cleaned: ${cleanOldPrice}), newPrice=${productData.currentPrice} (cleaned: ${cleanNewPrice})`);
          results.failed += 1;
          continue;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currencyCode || product.currency,
            name: productData.productName || product.name,
            image_url: productData.productImageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if(updateError) {
          console.error(`Failed to update product ID ${product.id}:`, updateError);
          console.error(`Product ID: ${product.id}, New Price: ${newPrice}, Old Price: ${oldPrice}`);
          results.failed += 1;
          continue; // Skip further processing for this product
        }

        if (oldPrice !== newPrice) {
          console.log(`Price changed for product ${product.id}: ${oldPrice} -> ${newPrice}`);
          results.priceChanges++; // Increment price changes counter when prices differ

          const { error: historyError } = await supabase
            .from("price_history")
            .insert({
              product_id: product.id,
              price: oldPrice,  // Store the old price in history (the previous price before the change)
              currency: product.currency || 'INR',
              checked_at: new Date().toISOString(),
            });

          if(historyError) {
            console.error(`Failed to add price history for product ID ${product.id}:`, historyError);
          } else {
            console.log(`Price history added for product ID ${product.id}: ${newPrice}`);
          }

          // Check if price dropped and send alert if needed
          if(newPrice < oldPrice) {
            console.log(`Price dropped for product ${product.id}: ${oldPrice} -> ${newPrice}`);

            // Get user email from auth system using user_id from products table
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(product.user_id);

            if(userData && userData.user && userData.user.email){
              const userEmail = userData.user.email;
              console.log(`Sending alert to user ${product.user_id} at ${userEmail} for product ${product.id}`);
              const emailResult = await sendPriceDropAlert(
                userEmail,
                {
                  ...product,
                  name: productData.productName || product.name,
                  image_url: productData.productImageUrl || product.image_url,
                  currency: productData.currencyCode || product.currency
                },
                oldPrice,
                newPrice
              );

              if(emailResult.success){
                console.log(`Email alert sent successfully for product ID ${product.id}`);
                results.alertsSent += 1;
              } else {
                console.error(`Failed to send email alert for product ID ${product.id}:`, emailResult.error);
              }
            } else {
              console.log(`No user email found for user ID ${product.user_id} in auth system. Error:`, userError);
              console.log(`UserData:`, userData);
              // Try to get user email from profiles table if it exists
              // Use the user_id from the product record to query profiles
              const { data: profileData, error: profileError } = await supabase
                .from('profiles') // Common Supabase naming for user profiles
                .select('email')
                .eq('id', product.user_id)
                .single();

              if (profileData && profileData.email) {
                const userEmail = profileData.email;
                console.log(`Found email in profiles table for user ${product.user_id}: ${userEmail}`);
                const emailResult = await sendPriceDropAlert(
                  userEmail,
                  {
                    ...product,
                    name: productData.productName || product.name,
                    image_url: productData.productImageUrl || product.image_url,
                    currency: productData.currencyCode || product.currency
                  },
                  oldPrice,
                  newPrice
                );

                if(emailResult.success){
                  console.log(`Email alert sent successfully for product ID ${product.id}`);
                  results.alertsSent += 1;
                } else {
                  console.error(`Failed to send email alert for product ID ${product.id}:`, emailResult.error);
                }
              } else {
                console.log(`No email found in profiles table for user ${product.user_id}. Profile error:`, profileError);
              }
            }
          } else {
            console.log(`Price increased or remained same for product ${product.id}: ${oldPrice} -> ${newPrice}`);
          }
        } else {
          console.log(`No price change for product ${product.id}: ${oldPrice}`);
        }
        results.updated++;
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        results.failed++;
      }
    }

    console.log(`Final results:`, results);
    return NextResponse.json({
      success: true,
      message: "Price check completed",
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint is working. Use POST to trigger.",
  });
}