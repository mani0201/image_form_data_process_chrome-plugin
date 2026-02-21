chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capture_screenshot") {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (imageUri) => {
          console.log("Screenshot captured:", imageUri);
          sendResponse({ screenshotUrl: imageUri });
      });
      return true; // Required for asynchronous `sendResponse`
  }
});
