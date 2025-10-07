/**
 * @type {import("knip").KnipConfig}
 */
const config = {
  ignore: ["infra/migrations/**"],
  ignoreDependencies: [
    "dotenv-expand",
    "@secretlint/secretlint-rule-preset-recommend",
  ],
};

export default config;
