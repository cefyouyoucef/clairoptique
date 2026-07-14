import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const cleanPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  if (cleanPath.startsWith("\\images") || cleanPath.startsWith("/images")) {
    return join(root, "public", cleanPath);
  }
  return join(root, cleanPath === "/" ? "preview.html" : cleanPath);
}

const server = createServer(async (request, response) => {
  let filePath = resolvePath(request.url || "/");

  try {
    const info = await stat(filePath);
    if (!info.isFile()) filePath = join(root, "preview.html");
  } catch {
    filePath = join(root, "preview.html");
  }

  response.setHeader("Content-Type", mimeTypes[extname(filePath)] || "application/octet-stream");
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ClairOptique preview running at http://127.0.0.1:${port}`);
});
