document.getElementById("startProcess").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]  // Load content script instead of calling a function
  });
});
