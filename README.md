# MM Jewels Shopify Theme

This is the custom Shopify theme for [mmjewelselection.com](https://mmjewelselection.com), developed and maintained by Xinyu Zhang.

## Features

- Based on Shopify Online Store 2.0 (likely Dawn or similar)
- Custom Liquid templates and sections
- Responsive layout
- SEO-friendly structure
- Multi-language support via JSON locale files

## Development Workflow

1. Edit theme files locally
2. Commit changes to Git
3. Zip and upload to Shopify manually via Admin

## Setup (optional CLI)

```bash
npm install -g @shopify/cli @shopify/theme
shopify theme pull --store mmjewelselection.myshopify.com
shopify theme dev

Note: Shopify CLI may require store owner access and proper authentication.

Author

Xinyu Zhang
github.com/xinyumz

You can of course customize this with whatever’s relevant to your dev process or team.

---

### 🚀 Commit these two files:

```bash
git add .gitignore README.md
git commit -m "Add .gitignore and basic README"
git push