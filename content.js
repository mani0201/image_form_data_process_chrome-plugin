console.log("QRCode Autofill Extension Loaded");

// ✅ Load Tesseract.js dynamically if not already loaded
async function loadTesseract() {
    if (typeof Tesseract !== "undefined") {
        console.log("Tesseract.js is already loaded.");
        return;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("tesseract.min.js");
        script.onload = () => {
            console.log("Tesseract.js loaded successfully.");
            resolve();
        };
        script.onerror = () => {
            reject(new Error("Failed to load Tesseract.js"));
        };
        document.body.appendChild(script);
    });
}

// ✅ Wait for element to be available before executing actions
function waitForElement(selector, callback) {
    const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
            observer.disconnect();
            callback(element);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// ✅ Extract text from image using Tesseract.js
async function extractTextFromImage(imageUrl) {
    console.log("Extracting text from image: ", imageUrl);

    try {
        await loadTesseract();
        if (typeof Tesseract === "undefined") {
            throw new Error("Tesseract.js is still not available after loading.");
        }

        const { createWorker } = Tesseract;
        const worker = await createWorker({
            logger: m => console.log("OCR Log:", m) // Debug OCR process
        });

        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        const { data: { text } } = await worker.recognize(imageUrl);
        await worker.terminate();

        console.log("Extracted text:", text);
        return text;
    } catch (error) {
        console.error("OCR extraction failed:", error);
        return "";
    }
}

// ✅ Improved Parsing Logic
function parseText(text) {
    let values = text.split("*");
    return {
        name: values[0]?.trim() || "",
        designation: values[1]?.trim() || "",
        company: values[2]?.trim() || "",
        website: values[3]?.trim() || "",
        address: values[4]?.trim() || "",
        email: values[5]?.trim() || "",
        contact: values[6]?.trim() || ""
    };
}

// ✅ Autofill the form with extracted data
function autofillForm(data) {
    document.querySelector('input[name="name"]').value = data.name;
    document.querySelector('input[name="designation"]').value = data.designation;
    document.querySelector('input[name="company_name"]').value = data.company;
    document.querySelector('input[name="website"]').value = data.website;
    document.querySelector('input[name="address"]').value = data.address;
    document.querySelector('input[name="email"]').value = data.email;
    document.querySelector('input[name="office_contact"]').value = data.contact;
}

// ✅ Capture Screenshot and Save
function takeScreenshotAndSave() {
    chrome.runtime.sendMessage({ action: "capture_screenshot" }, (response) => {
        if (response && response.screenshotUrl) {
            console.log("Screenshot saved:", response.screenshotUrl);
        }
    });
}

// ✅ Process Forms Sequentially
function processForms() {
    let formSelect = document.querySelector('select');
    let totalForms = formSelect.options.length;
    let currentIndex = 0;

    function processNextForm() {
        if (currentIndex >= totalForms) {
            console.log("All forms processed.");
            return;
        }

        formSelect.selectedIndex = currentIndex;
        formSelect.dispatchEvent(new Event('change'));

        waitForElement("#generateimg1 img", async (img) => {
            let imageUrl = img.src;
            let text = await extractTextFromImage(imageUrl);
            let formData = parseText(text);
            autofillForm(formData);

            setTimeout(() => {
                document.querySelector("#generateQRButton").click();
                setTimeout(() => {
                    takeScreenshotAndSave();
                    setTimeout(() => {
                        currentIndex++;
                        processNextForm();
                    }, 2000);
                }, 3000);
            }, 2000);
        });
    }

    processNextForm();
}

// ✅ Start processing forms
waitForElement('select', processForms);
