"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import DeleteButton from "@/components/DeleteButton";
import PriceChart from "@/components/PriceChart";
import { createClient } from "@/utils/supabase/client";

const ProductGrid = ({ initialProducts, user }) => {
  const [products, setProducts] = useState(initialProducts);
  const [priceHistories, setPriceHistories] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [visibleCharts, setVisibleCharts] = useState({});

  /* ---------------- FETCH PRICE HISTORY ---------------- */

  useEffect(() => {
    const fetchAllPriceHistories = async () => {
      const supabase = createClient();

      for (const product of products) {
        setLoadingStates((prev) => ({ ...prev, [product.id]: true }));

        const { data, error } = await supabase
          .from("price_history")
          .select("*")
          .eq("product_id", product.id)
          .order("checked_at", { ascending: true });

        setPriceHistories((prev) => ({
          ...prev,
          [product.id]: error ? [] : data ?? [],
        }));

        setLoadingStates((prev) => ({ ...prev, [product.id]: false }));
      }
    };

    if (user && products.length > 0) {
      fetchAllPriceHistories();
    }
  }, [user, products]);

  /* ---------------- UPDATE PRODUCTS ---------------- */

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  /* ---------------- RENDER ---------------- */

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {products.map((product) => (
        <Card
          key={product.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden transition hover:shadow-lg"
        >
          {/* IMAGE */}
          <div className="w-full h-48 bg-gray-50 flex items-center justify-center">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                width={200}
                height={200}
                className="object-contain w-full h-full p-3"
              />
            ) : (
              <div className="text-gray-400">No Image</div>
            )}
          </div>

          {/* CONTENT */}
          <CardContent className="p-4">
            {/* DETAILS */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
              {product.name}
            </h3>

            <p className="text-lg font-bold text-blue-600">
              {product.currency}{" "}
              {Number(product.current_price).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="text-sm text-gray-500 mb-4">
              Tracked Since:{" "}
              {new Date(product.created_at).toLocaleDateString("en-GB")}
            </p>

            {/* VIEW + DELETE */}
            <div className="flex gap-2 mb-4">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Visit Product
              </a>
              <DeleteButton productId={product.id} />
            </div>

            {/* TOGGLE BUTTON */}
            <Button
              variant="outline"
              className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() =>
                setVisibleCharts((prev) => ({
                  ...prev,
                  [product.id]: !prev[product.id],
                }))
              }
            >
              {visibleCharts[product.id]
                ? "Hide Price History"
                : "Show Price History"}
            </Button>

            {/* PRICE HISTORY */}
            {visibleCharts[product.id] && (
              <div className="mt-4">
                {loadingStates[product.id] ? (
                  <p className="text-center text-sm text-gray-500">
                    Loading price history...
                  </p>
                ) : (
                  <PriceChart
                    priceHistory={priceHistories[product.id] ?? []}
                    currentPrice={product.current_price}
                    currency={product.currency}
                    trackedSince={product.created_at}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
