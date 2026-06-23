import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { resolve } from "path";

export const maxDuration = 120;

export async function POST() {
  return new Promise<NextResponse>((done) => {
    const root = resolve(process.cwd());
    const child = spawn(
      "npx",
      ["tsx", "--tsconfig", "scripts/tsconfig.json", "scripts/audit-vendors.ts"],
      { cwd: root, env: { ...process.env } }
    );

    const lines: string[] = [];
    child.stdout.on("data", (d) => lines.push(d.toString()));
    child.stderr.on("data", (d) => lines.push(d.toString()));

    child.on("close", (code) => {
      done(NextResponse.json({ ok: code === 0, output: lines.join("") }));
    });
  });
}
