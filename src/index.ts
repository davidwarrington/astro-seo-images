import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { Cluster } from 'puppeteer-cluster';

function readDirRecursively(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((path) => {
    const fullPath = join(directory, path.name);
    if (path.isDirectory()) {
      return readDirRecursively(fullPath);
    }

    return fullPath;
  });
}

function getUnique<T>(array: T[]) {
  return [...new Set(array)];
}

interface Config {
  routes: string[];
  size?: {
    height: number;
    width: number;
  };
  puppeteerClusterOptions?: Parameters<typeof Cluster['launch']>[0];
}

export default function socialImages(
  {
    routes: imageRoutes,
    size: imageSize = {
      height: 600,
      width: 1200,
    },
    puppeteerClusterOptions = {},
  }: Config = { routes: [] }
): AstroIntegration {
  return {
    name: 'astro-social-images',
    hooks: {
      'astro:build:done': async ({ dir, routes }) => {
        const routesToGenerate = routes.filter((route) =>
          imageRoutes.includes(route.route)
        );

        if (routesToGenerate.length === 0) {
          return;
        }

        const distFiles = readDirRecursively(dir.pathname).map(
          (file) => `/${relative(dir.pathname, file)}`
        );

        const filesToScreenshot = getUnique(
          routesToGenerate.flatMap((route) =>
            distFiles.filter((file) => route.pattern.test(dirname(file)))
          )
        );

        if (filesToScreenshot.length === 0) {
          return;
        }

        const cluster: Cluster<string, void> = await Cluster.launch({
          concurrency: Cluster.CONCURRENCY_CONTEXT,
          maxConcurrency: 10,
          ...puppeteerClusterOptions,
        });

        await cluster.task(async ({ page, data: file }) => {
          const fullPath = join(dir.pathname, file);

          await page.setViewport(imageSize);

          await page.setRequestInterception(true);
          page.on('request', (request) => {
            const url = new URL(request.url());

            if (request.resourceType() !== 'document') {
              request.continue({
                url: join('file://', dir.pathname, url.pathname),
              });
            } else {
              request.continue();
            }
          });

          await page.goto(`file://${fullPath}`, {
            waitUntil: 'networkidle0',
          });

          await page.screenshot({
            path: fileURLToPath(new URL(`.${dirname(file)}.png`, dir)),
            encoding: 'binary',
          });
        });

        filesToScreenshot.forEach((file) => cluster.queue(file));

        await cluster.idle();
        await cluster.close();
      },
    },
  };
}
