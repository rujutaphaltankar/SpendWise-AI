import { env } from "../config/env";

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  if (env.ocrProvider === "google" && env.ocrApiKey) {
    return extractWithGoogleVision(imageBuffer);
  }
  return extractWithTesseract(imageBuffer);
}

async function extractWithTesseract(imageBuffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    // Tesseract.js's default CDN (jsDelivr) is blocked in some sandboxed/
    // firewalled environments. This community-hosted mirror on GitHub Pages
    // works in the same restrictive networks and needs no API key.
    langPath: "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0",
    gzip: true,
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(imageBuffer);
    return text;
  } finally {
    await worker.terminate();
  }
}

async function extractWithGoogleVision(imageBuffer: Buffer): Promise<string> {
  const base64Image = imageBuffer.toString("base64");

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${env.ocrApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data.responses?.[0]?.fullTextAnnotation?.text;
  if (!text) {
    throw new Error("Google Vision returned no text");
  }
  return text;
}
