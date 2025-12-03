import Busboy from "busboy";

// 요청 스트림을 Buffer로 변환
export async function readBuffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// multipart/form-data를 파싱해서 버퍼/파일명/컨텐트타입을 얻기
export async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    let fileBuffer = null;
    let filename = "";
    let fileContentType = "";
    const fields = {};

    bb.on("file", (name, file, info) => {
      filename = info.filename || "upload.bin";
      fileContentType = info.mimeType || "application/octet-stream";
      const chunks = [];
      file.on("data", chunk => chunks.push(chunk));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("error", reject);
    bb.on("finish", () => {
      if (!fileBuffer) return reject(new Error("no file in form"));
      resolve({ fileBuffer, filename, fileContentType, fields });
    });

    req.pipe(bb);
  });
}