/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './**/*.js',
    '!./node_modules/**',
    '!./node/**',
    './scripts/node-template.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};