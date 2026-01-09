// Background script for price monitoring
const CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
let checkIntervalId = null;

// Initialize the extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Trackify extension installed');
  startPriceMonitoring();
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  switch (request.action) {
    case 'startMonitoring':
      startPriceMonitoring();
      sendResponse({ success: true });
      break;

    case 'stopMonitoring':
      stopPriceMonitoring();
      sendResponse({ success: true });
      break;

    case 'manualCheck':
      checkPricesManually();
      sendResponse({ success: true });
      break;

    case 'setAdminEmails':
      setAdminEmails(request.emails);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return true; // Indicates we will send a response asynchronously
});

// Function to set admin emails in extension storage
async function setAdminEmails(emails) {
  if (Array.isArray(emails)) {
    await new Promise((resolve) => {
      chrome.storage.sync.set({ adminEmails: emails }, () => {
        console.log('Admin emails updated:', emails);
        resolve();
      });
    });
  }
}

// Start the price monitoring interval
function startPriceMonitoring() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
  }

  // Check prices immediately when starting
  checkPrices();

  // Set up recurring checks
  checkIntervalId = setInterval(checkPrices, CHECK_INTERVAL);
  console.log(`Price monitoring started. Checking every ${CHECK_INTERVAL / 60000} minutes.`);
}

// Stop the price monitoring interval
function stopPriceMonitoring() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log('Price monitoring stopped.');
  }
}

// Main function to check prices
async function checkPrices() {
  console.log('Starting price check...');

  try {
    // Get the cron secret from extension storage
    const cronSecret = await getCronSecret();

    if (!cronSecret) {
      console.error('Cron secret not found. Please configure in extension options.');
      return;
    }

    // Trigger the cron job to check prices
    const response = await fetch('https://trackify-it.vercel.app/api/cron/check-prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Price check completed:', result);

      // Show notification if there were price changes
      if (result.results && result.results.priceChanges > 0) {
        showNotification(`Price changes detected: ${result.results.priceChanges} products updated`);
      }
    } else {
      console.error('Price check failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error during price check:', error);
  }
}

// Function to get cron secret from extension storage
async function getCronSecret() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['cronSecret'], (result) => {
      resolve(result.cronSecret || null);
    });
  });
}

// Function to manually check prices (for debugging or manual triggers)
async function checkPricesManually() {
  console.log('Manual price check triggered');
  await checkPrices();
}

// Show a notification to the user
function showNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Trackify Price Alert',
    message: message,
    priority: 1
  });
}

// Listen for tab updates to potentially extract prices from product pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a product page we might want to monitor
    if (isProductPage(tab.url)) {
      // Inject content script to extract price
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }
  }
});

// Helper function to determine if a URL is likely a product page
function isProductPage(url) {
  // Simple heuristics to identify product pages
  const productIndicators = [
    '/product/',
    '/products/',
    '/item/',
    '/items/',
    '/p/',
    '?product_id=',
    '&pid=',
    'dp/',
    'gp/'
  ];

  const amazonPattern = /amazon\.[^/]+\/.*\/(?:dp|gp)\//;
  const flipkartPattern = /flipkart\.com\/.*\/p\//;

  const lowerUrl = url.toLowerCase();

  // Check for domain-specific patterns
  if (amazonPattern.test(lowerUrl) || flipkartPattern.test(lowerUrl)) {
    return true;
  }

  // Check for general product indicators
  return productIndicators.some(indicator => lowerUrl.includes(indicator));
}

console.log('Background script loaded and monitoring started.');