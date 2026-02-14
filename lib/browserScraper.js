import { chromium } from "playwright";

export async function scrapeWithBrowser(url) {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });
  await page.waitForTimeout(4000); // ⏳ allow JS prices to load

  const product = await page.evaluate(() => {
    const getText = (selector) =>
      document.querySelector(selector)?.innerText?.trim() || null;

    // 🟢 TITLE
    const title =
      getText("#productTitle") || // Amazon
      getText("h1") ||
      getText(".pdp-title") || // Flipkart
      getText(".B_NuCI") || // Flipkart alt
      getText(".product-title") ||
      getText("[data-testid='product-title']") ||
      null;

    // 🟢 PRICE (PRIORITY ORDER: selling price first)
    const price =
      getText(".a-price .a-offscreen") ||        // Amazon current selling price
      getText("#priceblock_dealprice") ||        // Amazon deal price
      getText("#priceblock_ourprice") ||         // Amazon regular price
      getText("._30jeq3") ||                     // Flipkart
      getText(".pdp-price") ||
      getText("[data-testid='price']") ||
      getText(".price") ||
      getText(".a-text-price span") ||           // MRP (fallback only)
      null;

    // 🟢 IMAGE
    const image =
      document.querySelector("#landingImage")?.src ||
      document.querySelector(".imgTagWrapper img")?.src ||
      document.querySelector("img")?.src ||
      null;

    return { title, price, image };
  });

  await browser.close();

  if (!product.title || !product.price) {
    throw new Error("Browser scraper failed to extract data");
  }

  // 🧼 Clean price (remove ₹, commas, text, spaces)
  const cleanPrice = (raw) => {
    if (!raw) return null;
    const numeric = raw.replace(/[^\d.]/g, "");
    return numeric || null;
  };

  const cleanedPrice = cleanPrice(product.price);

  if (!cleanedPrice) {
    throw new Error("Failed to clean product price");
  }

  return {
    productName: product.title,
    currentPrice: cleanedPrice, // ✅ Always numeric string like "7699"
    productImageUrl: product.image,
    currencyCode: product.price.includes("₹")
      ? "INR"
      : product.price.includes("$")
      ? "USD"
      : "UNKNOWN",
  };
}
