// Vite plugin providing the dwv web workers.
//
// dwv loads its workers from 'assets/workers/' relative to the page base url
// (document.baseURI). Vite does not pick them up from the dwv bundle: this
// plugin serves them with the dev server and adds them to the build output.
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const WORKERS_PATH = 'assets/workers/';

const CONTENT_TYPES = {
  '.js': 'text/javascript',
  '.map': 'application/json'
};

/**
 * Get the folder of the dwv workers: the dwv version used by dwv-react.
 *
 * @returns {string} The folder path.
 */
export function getDwvWorkersDir() {
  const require = createRequire(import.meta.url);
  // the dwv package does not export its package.json:
  // resolve its main file, in the 'dist' folder
  const dwvDist = path.dirname(require.resolve('dwv'));
  return path.join(dwvDist, WORKERS_PATH);
}

/**
 * Vite plugin serving the dwv web workers in dev and adding them
 * to the build output, in 'assets/workers/'.
 *
 * @param {object} [options] The plugin options.
 * @param {string} [options.workersDir] The dwv workers folder,
 *   defaults to the one of the dwv package used by dwv-react.
 * @returns {import('vite').Plugin} The Vite plugin.
 */
export function dwvWorkers(options = {}) {
  const workersDir = options.workersDir ?? getDwvWorkersDir();
  const fileNames = readdirSync(workersDir)
    .filter((name) => Object.hasOwn(CONTENT_TYPES, path.extname(name)));

  return {
    name: 'dwv-workers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // the page can be at any path: match the end of the url path
        const urlPath = (req.url ?? '').split(/[?#]/)[0];
        const fileName = fileNames.find(
          (name) => urlPath.endsWith('/' + WORKERS_PATH + name));
        if (!fileName) {
          next();
          return;
        }
        res.setHeader('Content-Type', CONTENT_TYPES[path.extname(fileName)]);
        res.end(readFileSync(path.join(workersDir, fileName)));
      });
    },
    generateBundle() {
      for (const name of fileNames) {
        this.emitFile({
          type: 'asset',
          fileName: WORKERS_PATH + name,
          source: readFileSync(path.join(workersDir, name))
        });
      }
    }
  };
}
