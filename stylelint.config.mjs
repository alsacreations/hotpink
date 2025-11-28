/**
 * @see https://stylelint.io/user-guide/configure/
 * @type {import('stylelint').Config}
 * Mise à jour : 2025-11-12
 */
export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html",
    "stylelint-config-property-sort-order-smacss",
  ],
  plugins: ["stylelint-order"],
  rules: {
    "selector-max-id": 0,
  },
};
