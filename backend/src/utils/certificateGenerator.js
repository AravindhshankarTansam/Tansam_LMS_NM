// utils/certificateGenerator.js
import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateCertificate(userName, courseTitle, percentage) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);

  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText("Certificate of Completion", {
    x: 150,
    y: height - 100,
    size: 20,
    font,
    color: rgb(0, 0.53, 0.71),
  });

  page.drawText(`Awarded to: ${userName}`, { x: 200, y: 250, size: 16, font });
  page.drawText(`For completing: ${courseTitle}`, { x: 180, y: 220, size: 14, font });
  page.drawText(`Completion: ${percentage}%`, { x: 250, y: 190, size: 12, font });

  const filePath = path.join("uploads/certificates", `${userName}-${Date.now()}.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, pdfBytes);

  return filePath;
}
