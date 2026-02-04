const fs = require('fs');
const path = require('path');

async function testApi() {
    const imagePath = 'C:/Users/eesca/.gemini/antigravity/brain/fe0d1ebf-deaf-4fee-9a08-1503b41b8d0c/uploaded_media_0_1770159770655.png';

    if (!fs.existsSync(imagePath)) {
        console.error("Image file not found:", imagePath);
        return;
    }

    // Read and convert to base64 data URL
    const bitmap = fs.readFileSync(imagePath);
    const base64Image = Buffer.from(bitmap).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log("Sending request to http://localhost:3000/api/extract...");
    console.log("Payload size approx:", (dataUrl.length / 1024 / 1024).toFixed(2), "MB");

    try {
        const response = await fetch('http://localhost:3000/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: dataUrl }),
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text.substring(0, 500) + "..."); // Log first 500 chars

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testApi();
