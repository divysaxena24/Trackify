import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Image from "next/image";
import { Rabbit, Shield, Bell } from "lucide-react";
import AddProductForm from "@/components/AddProdcut-Form";
import AuthButton from "@/components/ui/AuthButton";
import { createClient } from "@/utils/supabase/server";
import { TrendingDown } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";



export default async function Home() {

  const supabase = await createClient(); // Replace with actual user authentication logic

  const{
    data: { user}
  } = await supabase.auth.getUser();

  const products = user
    ? (
        await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).data || []
    : [];

  const FEATURES = [
    {
      icon: Rabbit,
      title: "Lightning Fast",
      description:
        "Deal Drop extracts prices in seconds, handling JavaScript and dynamic content",
    },
    {
      icon: Shield,
      title: "Always Reliable",
      description:
        "Works across all major e-commerce sites with built-in anti-bot protection",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Get notified instantly when prices drop below your target",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/lg.png"
                alt="Trackify Logo"
                width={250}
                height={50}
                className="transition-all duration-300 ease-in-out"

              />
            </div>
            <AuthButton user={user} />
          </div>
        </div>
      </header>

      <section className="pt-24 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-4 py-1 mb-6 text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200">
              Price Tracking Made Simple
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome to <span className="text-blue-600">Trackify</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-4 max-w-2xl mx-auto">
              Track product prices from any E-Commerce sites in real time and get alerts when the price drops.
            </p>

            <AddProductForm user={user} />

            <div className="mt-20">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Key Features</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {FEATURES.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <feature.icon className="w-12 h-12 mb-6 text-blue-600 mx-auto" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* here we will render all products if length is not 0 */}
        {user && products.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Your Tracked Products
            </h2>

            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6">
              <ProductGrid initialProducts={products} user={user} />
            </div>
          </section>
        )}


         {user && products.length === 0 && (
            <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12">

                <TrendingDown className="w-16 h-16 text-gray-400 mx-auto mb-4" />

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products yet
                </h3>

                <p className="text-gray-600">
                  Add your first product above to start tracking prices!
                </p>

              </div>
            </section>
          )}

    </main>
  );
}
