// Module 3: your first call to a Large Language Model.
// Run it with:  node hello-ai.js
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from .env

const response = await client.beta.messages.create({
  model: process.env.MODEL || "claude-opus-5",
  max_tokens: 16000,
  output_config: { effort: "low" },
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
  system: "You are a friendly computer science lecturer.",
  messages: [
    { role: "user", content: "Explain what an API is to a first-year student in 3 sentences." },
  ],
});

for (const block of response.content) {
  if (block.type === "text") console.log(block.text);
}

console.log("\nStop reason:", response.stop_reason);
console.log("Tokens used:", response.usage.input_tokens, "in /", response.usage.output_tokens, "out");
