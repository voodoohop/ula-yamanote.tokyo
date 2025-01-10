import { boot } from "https://v2-11-1--edge.netlify.com/bootstrap/index-combined.ts";

const functions = {}; const metadata = { functions: {} };


      try {
        const { default: func } = await import("file:///Users/thomash/Documents/GitHub/ula-yamanote.tokyo/netlify/edge-functions/counter-stream.ts");

        if (typeof func === "function") {
          functions["counter-stream"] = func;
          metadata.functions["counter-stream"] = {"url":"file:///Users/thomash/Documents/GitHub/ula-yamanote.tokyo/netlify/edge-functions/counter-stream.ts"}
        } else {
          console.log("\u001b[91m◈\u001b[39m \u001b[31mFailed\u001b[39m to load Edge Function \u001b[33mcounter-stream\u001b[39m. The file does not seem to have a function as the default export.");
        }
      } catch (error) {
        console.log("\u001b[91m◈\u001b[39m \u001b[31mFailed\u001b[39m to run Edge Function \u001b[33mcounter-stream\u001b[39m:");
        console.error(error);
      }
      

boot(functions, metadata);