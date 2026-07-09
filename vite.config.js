import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT for GitHub Pages:
// If you deploy to https://<user>.github.io/<repo-name>/
// change base below to "/<repo-name>/"
// If you deploy to a custom domain or a user/organization page
// (https://<user>.github.io/), leave base as "/"
export default defineConfig({
  plugins: [react()],
  base: "/majestic-helper/",
});
