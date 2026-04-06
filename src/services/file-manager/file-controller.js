import path from "path";
import multer from "multer";
import {
  saveFile,
  listFiles,
  getFileStream,
  deleteFile,
  deleteAllFiles
} from "./file-service.js";

const upload = multer({ storage: multer.memoryStorage() });

export function registerFileRoutes(app) {
  // 📤 Upload
  app.post("/api/files/upload", upload.single("file"), async (req, res) => {
    try {
      const { path: dirPath } = req.body;

      if (!dirPath || !req.file) {
        return res.status(400).json({ error: "path and file required" });
      }

      const result = await saveFile({
        file: req.file,
        dirPath
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 📥 Download
  app.get("/api/files", async (req, res) => {
    try {
      const { path: dirPath, fileName } = req.query;

      const filePath = path.join(dirPath, fileName);

      const stream = getFileStream(filePath);

      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      stream.pipe(res);
    } catch (err) {
      res.status(404).json({ error: "File not found" });
    }
  });

  // 📃 List files
  app.get("/api/files/list", async (req, res) => {
    try {
      const { path: dirPath } = req.query;

      const files = await listFiles(dirPath);

      res.json({ files });
    } catch (err) {
      res.status(404).json({ error: "Directory not found" });
    }
  });

  // 🗑️ Delete single file
  app.delete("/api/files", async (req, res) => {
    try {
      const { path: dirPath, fileName } = req.query;

      const filePath = path.join(dirPath, fileName);

      await deleteFile(filePath);

      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: "File not found" });
    }
  });

  // 🧹 Delete all files
  app.delete("/api/files/all", async (req, res) => {
    try {
      const { path: dirPath } = req.query;

      await deleteAllFiles(dirPath);

      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: "Directory not found" });
    }
  });
}