// @vitest-environment node
import { existsSync, readdirSync } from 'node:fs';

import { dwvWorkers, getDwvWorkersDir } from './dwvWorkers.js';

/**
 * Call the plugin dev server middleware with an url.
 *
 * @param {object} plugin The plugin.
 * @param {string} url The request url.
 * @returns {object} The response mock and the next spy.
 */
function serve(plugin, url) {
  let middleware;
  plugin.configureServer({
    middlewares: { use: (fn) => { middleware = fn; } }
  });
  const res = { setHeader: vi.fn(), end: vi.fn() };
  const next = vi.fn();
  middleware({ url }, res, next);
  return { res, next };
}

describe('dwvWorkers vite plugin', () => {
  const workersDir = getDwvWorkersDir();

  it('finds the dwv workers folder', () => {
    expect(existsSync(workersDir)).toBe(true);
    expect(readdirSync(workersDir)).toContain('jpeg2000.worker.min.js');
  });

  it('emits the workers in the build', () => {
    const emitFile = vi.fn();
    dwvWorkers().generateBundle.call({ emitFile });
    const fileNames = emitFile.mock.calls.map(([file]) => file.fileName);
    expect(fileNames.sort()).toEqual(
      readdirSync(workersDir).map((name) => 'assets/workers/' + name).sort());
    expect(emitFile.mock.calls[0][0].type).toBe('asset');
  });

  it('serves the workers in dev, from any page path', () => {
    const plugin = dwvWorkers();
    for (const url of [
      '/assets/workers/rle.worker.min.js',
      '/dwv-react/demo/trunk/assets/workers/rle.worker.min.js?v=1'
    ]) {
      const { res, next } = serve(plugin, url);
      expect(next).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type', 'text/javascript');
      expect(res.end).toHaveBeenCalledTimes(1);
    }
  });

  it('passes other requests on', () => {
    const plugin = dwvWorkers();
    for (const url of [
      '/index.html',
      '/assets/workers/unknown.worker.min.js',
      '/rle.worker.min.js'
    ]) {
      const { res, next } = serve(plugin, url);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.end).not.toHaveBeenCalled();
    }
  });

  it('accepts a workers folder option', () => {
    const emitFile = vi.fn();
    dwvWorkers({ workersDir }).generateBundle.call({ emitFile });
    expect(emitFile).toHaveBeenCalled();
  });
});
