// ocr.js
import fetch from "node-fetch";
import FormData from "form-data";
import { Readable } from "stream";

const API_KEY = process.env.UPSTAGE_API_KEY;

export async function solarOCR(fileBuffer, fileName) {
  try {
    const formData = new FormData();
    
    // Buffer를 Stream으로 변환
    const stream = Readable.from(fileBuffer);
    formData.append("document", stream, fileName);
    formData.append("schema", "oac");
    formData.append("model", "ocr");
    
    const response = await fetch("https://api.upstage.ai/v1/document-digitization", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: formData
    });
    
    return await response.json();
  } catch (error) {
    console.error("OCR error:", error);
    throw error;
  }
}
