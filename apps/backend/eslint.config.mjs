// @ts-check
import { config } from "@repo/eslint-config/nest";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["prisma/**/*.js", "prisma/*.js"],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
];

