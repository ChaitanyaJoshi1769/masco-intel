// Service worker for background operations
chrome.runtime.onInstalled.addListener(() => {
  console.log('Masco Intel extension installed');
});

// Optional: Handle extension-wide events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could pre-fetch data, analytics, etc.
  }
});
