// Content script for price extraction
console.log('Trackify content script loaded on:', window.location.href);

// Wait for the page to fully load
window.addEventListener('load', function() {
  extractAndDisplayPrice();
});

// Function to extract price from the current page
function extractAndDisplayPrice() {
  // Different selectors for different e-commerce sites
  const priceSelectors = [
    // Amazon
    '[data-asin] .a-price-whole',
    '[data-asin] .a-offscreen',
    '.a-price .a-offscreen',
    '.a-price-whole',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice',
    
    // Flipkart
    '.BPy14n .Ye30r8 ._1lRUDl ._1vC4OE',
    '.BPy14n .Ye30r8 ._1lRUDl ._3qQ9m1',
    '.BPy14n .Ye30r8 ._1lRUDl ._2_A9Ll',
    '._1vC4OE._3qQ9m1',
    '._1vC4OE._3qQ9m1._3t5qTG',
    
    // General selectors
    '[itemprop="price"]',
    '.price',
    '.product-price',
    '.current-price',
    '.special-price',
    '.sale-price',
    '.product__price',
    '.money-amount__price',
    '.woocommerce-Price-amount',
    '.product-price .price',
    '.js-price',
    '.Price-head'
  ];

  let price = null;
  
  // Try each selector until we find a price
  for (const selector of priceSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent.trim();
      if (text && extractPriceValue(text)) {
        price = extractPriceValue(text);
        break;
      }
    }
    if (price) break;
  }
  
  // If we couldn't find price with selectors, try alternative methods
  if (!price) {
    price = extractPriceFromText(document.body.innerText);
  }
  
  if (price) {
    console.log('Found price on page:', price);
    
    // Send the price information to the background script
    chrome.runtime.sendMessage({
      action: 'priceFound',
      url: window.location.href,
      price: price,
      productName: extractProductName()
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log('Error sending price to background:', chrome.runtime.lastError);
      } else {
        console.log('Price sent to background script:', response);
      }
    });
  } else {
    console.log('No price found on this page');
  }
}

// Helper function to extract numeric price value from text
function extractPriceValue(text) {
  if (!text) return null;
  
  // Remove common non-numeric characters but keep decimal points
  // This regex looks for currency symbols followed by numbers with optional decimal
  const priceRegex = /(?:Rs\.?|₹|Rs|INR|USD|\$|€|£|¥)?\s*(\d{1,3}(?:[.,]\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/i;
  const match = text.match(priceRegex);
  
  if (match) {
    // Extract the numeric part
    let priceStr = match[1];
    // Remove any commas or periods used as thousand separators, keep decimal point
    priceStr = priceStr.replace(/,/g, '');
    
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      return price;
    }
  }
  
  return null;
}

// Helper function to extract price from general text
function extractPriceFromText(text) {
  if (!text) return null;
  
  // Look for patterns like "Rs 1234", "₹1,234.56", "$12.99", etc.
  const pricePatterns = [
    /(?:Rs\.?|₹|Rs|INR|USD|\$|€|£|¥)\s*([\d,]+\.?\d*)/gi,
    /([\d,]+\.?\d*)\s*(?:Rs\.?|₹|Rs|INR|USD|\$|€|£|¥)/gi,
    /price.*?([\d,]+\.?\d*)/i,
    /deal.*?([\d,]+\.?\d*)/i
  ];
  
  for (const pattern of pricePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const extracted = extractPriceValue(match);
        if (extracted) {
          return extracted;
        }
      }
    }
  }
  
  return null;
}

// Helper function to extract product name
function extractProductName() {
  // Try to get product name from various possible locations
  const titleSelectors = [
    'title',
    'h1',
    'h2',
    '[data-asin] h1',
    '#productTitle',
    '#title',
    '.product-title',
    '.product-name',
    '.pdp-product-title',
    '.product__title',
    '.product-name h1',
    '.product-name .h1',
    '.productInfo h1',
    '.product-name a',
    '.product-title-text'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim().substring(0, 100); // Limit length
    }
  }
  
  // Fallback to title tag
  if (document.title) {
    return document.title.substring(0, 100);
  }
  
  return 'Unknown Product';
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPrice') {
    extractAndDisplayPrice();
    sendResponse({ success: true, price: 'extraction started' });
  }
});