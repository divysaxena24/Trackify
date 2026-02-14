import Firecrawl from "@mendable/firecrawl-js";
import { scrapeWithBrowser } from "./browserScraper.js";

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export async function scrapeProduct(url) {
  try {
    console.log("🔍 Attempting Firecrawl scrape:", url);

    const result = await firecrawl.scrape(url, {
      formats: [
        {
          type: "json",
          schema: {
            type: "object",
            required: ["productName", "currentPrice"],
            properties: {
              productName: { type: "string" },
              currentPrice: { type: "string" },
              currencyCode: { type: "string" },
              productImageUrl: { type: "string" },
            },
          },
          prompt: `
Extract:
- product name as "productName"
- price as "currentPrice"
- currency as "currencyCode"
- main image as "productImageUrl"
Return only JSON.
`,
        },
      ],
      options: {
        render: true,
        wait: 5000,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const extractedData =
      result?.data?.json || result?.json || null;

    if (!extractedData?.productName || !extractedData?.currentPrice) {
      throw new Error("Firecrawl could not extract product data");
    }

    console.log("✅ Firecrawl success:", extractedData);
    return extractedData;
  } catch (error) {
    console.warn("⚠ Firecrawl failed, switching to browser scraper...");
    console.warn("Reason:", error.message);

    // 🔥 Fallback for ANY site
    try {
      const browserData = await scrapeWithBrowser(url);
      console.log("✅ Browser scraper success:", browserData);
      return browserData;
    } catch (browserError) {
      console.error("❌ Browser scraper also failed:", browserError);
      throw new Error(
        "Failed to scrape product data. Please check the URL and try again."
      );
    }
  }
}
