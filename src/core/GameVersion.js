export async function loadGameVersion(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') throw new Error('Game version loader requires fetch.');
  const response = await fetchImpl('./package.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to read game version: ${response.status} ${response.statusText}`);
  }
  const manifest = await response.json();
  if (typeof manifest.version !== 'string' || manifest.version.trim() === '') {
    throw new Error('package.json does not define a game version.');
  }
  return manifest.version;
}
