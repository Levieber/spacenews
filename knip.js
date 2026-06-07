/**
 * @type {import("knip").KnipConfig}
 */
const config = {
  ignore: ["infra/migrations/**"],
  paths: {
    "@models/*": ["./models/*"],
    "@infra/*": ["./infra/*"],
    "@tests/*": ["./tests/*"],
  },
  ignoreDependencies: [
    "dotenv-expand",
    "@secretlint/secretlint-rule-preset-recommend",
  ],
};

export default config;
