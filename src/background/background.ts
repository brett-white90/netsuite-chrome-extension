// Simple background script setup
const setupBackgroundScript = () => {
    console.log('Background script initialized');
    
    // Add basic message listener
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        console.log('Message received in background:', request);
        sendResponse({status: 'received'});
        return true;
      }
    );
  };
  
  setupBackgroundScript();