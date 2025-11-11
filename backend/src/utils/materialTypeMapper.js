import path from "path";

export const detectMaterialType = (filename = "") => {
  const ext = path.extname(filename).toLowerCase();

  const map = {
    video: [".mp4", ".mkv", ".mov", ".avi"],
    audio: [".mp3", ".wav", ".aac"],
    pdf: [".pdf"],
    ppt: [".ppt", ".pptx"],
    doc: [".doc", ".docx"],
    image: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"],
    archive: [".zip", ".rar", ".7z"],
  };

  for (const [type, exts] of Object.entries(map)) {
    if (exts.includes(ext)) return type;
  }

  return "other";
};
