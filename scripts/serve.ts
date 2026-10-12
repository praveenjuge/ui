/** Shared by the render and look scripts: build the site, serve dist/, run a command. */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "..");

/** A static server for dist/, mapping /render/12 to render/12.html as the host does. */
function serve(root: string): Promise<Server> {
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".woff2": "font/woff2",
  };
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
    for (const file of [join(root, path), join(root, `${path}.html`)]) {
      if (!file.startsWith(root + "/") || !existsSync(file) || path.endsWith("/")) continue;
      try {
        const body = await readFile(file);
        res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
        return void res.end(body);
      } catch {}
    }
    res.writeHead(404).end();
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

/** Serves dist/ on a free port; returns its base URL and a way to stop it. */
export async function serveDist() {
  const server = await serve(join(ROOT, "dist"));
  return { base: `http://127.0.0.1:${(server.address() as { port: number }).port}`, close: () => server.close() };
}

export function run(cmd: string, argv: string[], { quiet = false } = {}) {
  return new Promise<void>((ok, no) => {
    const child = spawn(cmd, argv, { cwd: ROOT, stdio: quiet ? ["ignore", "ignore", "inherit"] : "inherit" });
    child.on("error", no);
    child.on("exit", (code) => (code === 0 ? ok() : no(new Error(`${cmd} ${argv.join(" ")} exited with ${code}`))));
  });
}

