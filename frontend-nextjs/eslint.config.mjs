import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 禁用未使用变量警告
      "@typescript-eslint/no-unused-vars": "warn",
      // 允许使用 any 类型
      "@typescript-eslint/no-explicit-any": "warn",
      // 允许在实体中使用引号
      "react/no-unescaped-entities": "off",
      // 放宽 hooks 依赖警告
      "react-hooks/exhaustive-deps": "warn",
      // 允许使用 Function 类型
      "@typescript-eslint/no-unsafe-function-type": "warn",
      // 允许条件式调用 hooks (在确保不违反 React 规则的情况下)
      "react-hooks/rules-of-hooks": "warn"
    }
  }
];

export default eslintConfig;
