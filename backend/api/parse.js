// parse.js
import fetch from "node-fetch";
import FormData from "form-data";
import { Readable } from "stream";

const API_KEY = process.env.UPSTAGE_API_KEY;

export async function solarParse(fileBuffer, fileName) {
  try {
    const formData = new FormData();
    
    // Buffer를 Stream으로 변환
    const stream = Readable.from(fileBuffer);
    formData.append("document", stream, fileName);
    formData.append("output_formats", JSON.stringify(["html", "text"]));
    formData.append("base64_encoding", JSON.stringify(["table"]));
    formData.append("ocr", "auto");
    formData.append("coordinates", "true");
    formData.append("model", "document-parse");
    
    const response = await fetch(
      "https://api.upstage.ai/v1/document-digitization",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}` },
        body: formData
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Parse error:", error);
    throw error;
  }
}
