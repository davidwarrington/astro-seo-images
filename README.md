# Astro SEO Images

Use Astro templates to generate social images for your Astro build

## Usage

## Install

```bash
pnpm install --save-dev astro-seo-images

# or if you prefer yarn
yarn add --dev astro-seo-images

# or if you prefer npm
npm install --save-dev astro-seo-images
```

### Create your template(s)

This example is at `/src/pages/blog/[slug]/card.astro`. You can visit this page whilst running in dev mode to check how it will look.

You can create any template you like here. Import CSS, JavaScript and images to your hearts content.

```astro
---
// /src/pages/blog/[slug]/card.astro
export async function getStaticPaths() {
  return ['a', 'b', 'c'].map(slug => {
    return {
      params: { slug },
      props: { title: slug },
    },
  });
}

export interface Props {
  title: string;
}

const { title } = Astro.props as Props;
---

<h1>
  {title}
</h1>

```

## Add the integrations

Add the integration to your Astro config. The `routes` property is required. For any file you wish to use as a template just remove `/src/pages` from the beginning of the filepath, and the `.astro` extension, and that will be your route. `routes` accepts an array so if you have multiple templates you wish to use this should work.

```ts
import { defineConfig } from 'astro/config';
import socialImages from 'astro-seo-images';

export default defineConfig({
  integrations: [
    socialImages({
      routes: ['/blog/[slug]/card'],
    }),
  ],
});
```

## Build your site

On creating a production build PNG images will be generated at the routes you provided. In the example above this would mean I could expect to see images at `/dist/blog/a/card.png`, `/dist/blog/b/card.png` and `/dist/blog/c/card.png`.
