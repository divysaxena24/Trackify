document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('optionsForm');
  const cronSecretInput = document.getElementById('cronSecret');
  const statusDiv = document.getElementById('status');

  // Load saved cron secret
  chrome.storage.sync.get(['cronSecret'], function(result) {
    if (result.cronSecret) {
      cronSecretInput.value = result.cronSecret;
    }
  });

  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cronSecret = cronSecretInput.value.trim();
    
    if (!cronSecret) {
      showStatus('Please enter a cron secret', 'error');
      return;
    }

    // Save the cron secret
    chrome.storage.sync.set({
      cronSecret: cronSecret
    }, function() {
      showStatus('Cron secret saved successfully!', 'success');
      
      // Update background script if needed
      chrome.runtime.getBackgroundPage(function(bgPage) {
        if (bgPage && bgPage.startPriceMonitoring) {
          // Restart monitoring to use new secret
          bgPage.startPriceMonitoring();
        }
      });
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Clear status after 3 seconds
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }
});