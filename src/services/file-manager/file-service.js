import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

export async function saveFile({ file, dirPath }) {
  await fs.mkdir(dirPath, { recursive: true });

  const filePath = path.join(dirPath, file.originalname);

  await fs.writeFile(filePath, file.buffer);

  return {
    fileName: file.originalname,
    path: filePath
  };
}

export async function listFiles(dirPath) {
  const files = await fs.readdir(dirPath, { withFileTypes: true });

  return files
    .filter(f => f.isFile())
    .map(f => f.name);
}

export function getFileStream(filePath) {
  return createReadStream(filePath);
}

export async function deleteFile(filePath) {
  await fs.unlink(filePath);
}

export async function deleteAllFiles(dirPath) {
  const files = await fs.readdir(dirPath);

  await Promise.all(
    files.map(file => fs.unlink(path.join(dirPath, file)))
  );
}