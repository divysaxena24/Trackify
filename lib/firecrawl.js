import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function scrapeProduct(url) {
    try {
        console.log("Attempting to scrape URL:", url); // Debug log

        const result = await firecrawl.scrape(url, {
            formats: [{
                type: 'json',
                schema: {
                    type: "object",
                    required: ["productName", "currentPrice"],
                    properties: {
                        productName: {
                            type: "string",
                            description: "The name of the product"
                        },
                        currentPrice: {
                            type: "string",
                            description: "The current price of the product as a string"
                        },
                        currencyCode: {
                            type: "string",
                            description: "The currency code (USD, EUR, etc)"
                        },
                        productImageUrl: {
                            type: "string",
                            description: "The URL of the product image"
                        }
                    }
                },
                prompt: "Extract the product name as 'productName', current price as 'currentPrice', currency code (USD, EUR, etc) as 'currencyCode', and product image URL as 'productImageUrl' if available. Make sure to return the price as a string representation of the number."
            }]
        });

        console.log("Firecrawl result:", result); // Debug log

        // Check if the result has the expected structure
        if (!result) {
            throw new Error("No response from Firecrawl API");
        }

        // The response structure might be different - let's check what's available
        let extractedData;
        if (result.data && result.data.json) {
            extractedData = result.data.json;
        } else if (result.json) {
            extractedData = result.json;
        } else {
            console.log("Unexpected response structure:", result);
            throw new Error("Unexpected response structure from Firecrawl API");
        }

        if (!extractedData || !extractedData.productName || !extractedData.currentPrice) {
            console.log("Missing required data in extracted result:", extractedData);
            // Provide a more user-friendly error message
            if (!extractedData.productName && !extractedData.currentPrice) {
                throw new Error("Could not extract product name and price. Please check the URL and try again.");
            } else if (!extractedData.productName) {
                throw new Error("Could not extract product name. Please check the URL and try again.");
            } else if (!extractedData.currentPrice) {
                throw new Error("Could not extract product price. Please check the URL and try again.");
            } else {
                throw new Error("Could not extract required product information. Please check the URL and try again.");
            }
        }

        console.log("Successfully extracted product data:", extractedData); // Debug log
        return extractedData;

    } catch (error) {
        console.error("Scraping error:", error);
        // Provide a more user-friendly error message
        if (error.message.includes("Could not extract")) {
            throw new Error(error.message);
        } else {
            throw new Error("Failed to scrape product data. Please check the URL and try again.");
        }
    }
}