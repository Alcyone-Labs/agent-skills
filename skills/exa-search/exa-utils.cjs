#!/usr/bin/env node

const https = require("https");
const path = require("path");
const { execFileSync } = require("child_process");

const EXA_API_HOST = "api.exa.ai";

function resolveSkillPath(...parts) {
  return path.join(__dirname, ...parts);
}

function loadApiKey() {
  const envKey = process.env.EXA_API_KEY?.trim();
  if (envKey) {
    return envKey;
  }

  try {
    const key = execFileSync(resolveSkillPath("get-key.sh"), ["--quiet"], {
      encoding: "utf-8",
    }).trim();

    if (!key) {
      throw new Error("empty-key");
    }

    return key;
  } catch {
    throw new Error(
      "Exa API key not configured. Run: exa-set-key YOUR_API_KEY (https://dashboard.exa.ai/api-keys)",
    );
  }
}

async function exaPostJson(apiPath, payload, apiKey) {
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: EXA_API_HOST,
        path: apiPath,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "x-api-key": apiKey,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          const status = res.statusCode ?? 500;

          if (status >= 400) {
            reject(new Error(`Exa API error ${status}: ${text}`));
            return;
          }

          try {
            resolve(JSON.parse(text));
          } catch {
            reject(new Error(`Exa API returned invalid JSON: ${text}`));
          }
        });
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = {
  loadApiKey,
  exaPostJson,
};
