import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration, IntegrationResolvedRoute } from 'astro';
import { Cluster } from 'playwright-cluster';

function readDirectoryRecursively(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(path => {
    const fullPath = join(directory, path.name);
    if (path.isDirectory()) {
      return readDirectoryRecursively(fullPath);
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
  puppeteerClusterOptions?: Parameters<(typeof Cluster)['launch']>[0];
}

export default function socialImages({
  routes: imageRoutes,
  size: imageSize = {
    height: 600,
    width: 1200,
  },
  puppeteerClusterOptions = {},
}: Config): AstroIntegration {
  let routes: IntegrationResolvedRoute[] = [];

  return {
    name: 'astro-social-images',
    hooks: {
      'astro:routes:resolved': async ({ routes: resolvedRoutes }) => {
        routes = resolvedRoutes;
      },

      'astro:build:done': async ({ dir }) => {
        const routesToGenerate = routes.filter(route =>
          imageRoutes.includes(route.pattern),
        );

        if (routesToGenerate.length === 0) {
          return;
        }

        const distributionFiles = readDirectoryRecursively(dir.pathname).map(
          file => `/${relative(dir.pathname, file)}`,
        );

        const filesToScreenshot = getUnique(
          routesToGenerate.flatMap(route =>
            distributionFiles.filter(file =>
              route.patternRegex.test(dirname(file)),
            ),
          ),
        );

        if (filesToScreenshot.length === 0) {
          return;
        }

        const cluster: Cluster<string, void> = await Cluster.launch({
          concurrency: Cluster.CONCURRENCY_CONTEXT,
          maxConcurrency: 10,
          playwrightOptions: {
            headless: true,
          },
          ...puppeteerClusterOptions,
        });

        await cluster.task(async ({ page, data: file }) => {
          const fullPath = join(dir.pathname, file);

          await page.setViewportSize(imageSize);

          page.route('**/*', route => {
            const request = route.request();
            const resourceType = request.resourceType();
            const url = new URL(request.url());

            if (resourceType === 'document') {
              route.continue();
            } else {
              route.continue({
                url: join('file://', dir.pathname, url.pathname),
              });
            }
          });

          await page.goto(`file://${fullPath}`, {
            waitUntil: 'networkidle',
          });

          await page.screenshot({
            path: fileURLToPath(new URL(`.${dirname(file)}.png`, dir)),
            type: 'png',
          });
        });

        filesToScreenshot.forEach(file => cluster.queue(file));

        await cluster.idle();
        await cluster.close();
      },
    },
  };
}
