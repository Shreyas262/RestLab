import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

// Import direction from docs/ARCHITECTURE.md §4 (ADR-021). Keep in sync with that diagram.
const layers = [
  "app",
  "features",
  "components",
  "lib",
  "domain",
  "execution",
  "server",
];

const allowedImports = {
  app: ["features", "components", "lib", "domain", "server"],
  features: ["components", "lib", "domain", "execution"],
  components: ["lib"],
  lib: [],
  domain: [],
  execution: ["domain"],
  server: ["domain", "execution"],
};

// Matches both "@/layer/..." and relative "../layer/..." specifiers.
const layerImport = (layer) => `^(@/|(\\.\\./)+)${layer}(/|$)`;

const importDirectionRules = Object.entries(allowedImports).map(
  ([layer, allowed]) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: layers
            .filter((other) => other !== layer && !allowed.includes(other))
            .map((other) => ({
              regex: layerImport(other),
              message: `${layer}/ must not import from ${other}/ (docs/ARCHITECTURE.md §4).`,
            })),
        },
      ],
    },
  }),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  ...importDirectionRules,
  eslintConfigPrettier,
]);

export default eslintConfig;
