module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 8,
  },
  extends: ["plugin:prettier/recommended"],
  rules: {
    quotes: ["error", "double"],
  },
};
