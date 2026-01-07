import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ message: "Price Tracker endpoint is working." });
}

export async function POST(request) {
    try{
        const authHeader = request.headers.get("Authorization");
        const cronSecret = process.env.CRON_SECRET;

        if(!cronSecret || authHeader !== `Bearer ${cronSecret}`){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("*, user_id, current_price, currency, name, image_url, url");

        if(productsError) throw productsError;

        const results = {
            total : products.length,
            updated: 0,
            failed: 0,
            priceChanges: 0,
            alertsSent:0
        };

        for(const product of products){
            try{

                const productData = await scrapeProduct(product.url);

                if(!productData || !productData.currentPrice){
                    results.failed += 1;
                    continue;
                }

                const newPrice = parseFloat(productData.currentPrice);
                const oldPrice = parseFloat(product.current_price);

                // Update product with new price if it changed
                if(newPrice !== oldPrice) {
                    const { error: updateError } = await supabase
                        .from("products")
                        .update({
                            current_price: newPrice,
                            ...(productData.productName && { name: productData.productName }),
                            ...(productData.productImageUrl && { image_url: productData.productImageUrl }),
                            ...(productData.currencyCode && { currency: productData.currencyCode }),
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", product.id);

                    if(updateError) {
                        console.error(`Failed to update product ID ${product.id}:`, updateError);
                        results.failed += 1;
                    } else {
                        results.updated += 1;
                        results.priceChanges += 1;

                        // Check if price dropped and send alert if needed
                        if(newPrice < oldPrice) {
                            // Get user email to send notification
                            const { data: user, error: userError } = await supabase.auth.admin.getUserById(product.user_id);

                            if(user && user.email){
                                const emailResult = await sendPriceDropAlert(
                                    user.email,
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
                                    results.alertsSent += 1;
                                } else {
                                    console.error(`Failed to send email alert for product ID ${product.id}:`, emailResult.error);
                                }
                            }
                        }
                    }
                } else {
                    results.updated += 1;
                }

            }catch(error){
                console.error(`Failed to update product ID ${product.id}:`, error);
                results.failed += 1;
            }
        }

        return NextResponse.json({
            success : true,
            message : "Price check completed.",
            results,
        });

    }catch(error){
        console.error("Cron job error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}