import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: "G-code Combiner - Bambu Lab Print File Combiner",
    meta: {
      description:
        "Combine multiple Bambu Lab .gcode.3mf print files into one continuous print with auto-ejection between prints.",
      viewport: "width=device-width, initial-scale=1.0",
      "theme-color": "#09090b",
    },
  },
});
