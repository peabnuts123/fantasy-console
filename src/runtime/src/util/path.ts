/**
 * Get the file extension of the given path. Includes the dot e.g. `.txt`.
 * Returns empty string if file has no extension.
 * @param path File path e.g. `models/player/player.obj`
 * @returns File extension include the dot (e.g. `.obj`), or empty string if path has no extension.
 */
export function getFileExtension(path: string): string {
  let match = /\.[^.]+$/.exec(path);
  if (match === null) {
    return '';
  } else {
    return match[0];
  }
}

/**
 * Convert a path string into a list of string path segments,
 * excluding the file's base name itself.
 */
export function toPathList(path: string): string[] {
  const pathSegments = path.split(/\/+/g);
  // Drop the basename from the path
  pathSegments.pop();
  return pathSegments;
}

/**
 * Get the filename from a path. e.g. `textures/house/brick.png` => `brick.png`
 * Assumes the last segment in the path is a file name, does not do any validation
 * to check whether the path is a directory path.
 */
export function baseName(path: string): string {
  return path.split(/\/+/g).pop()!;
}

/**
 * Rename the file (base name) part of a path, preserving the full parent path
 * @param path Path to rename
 * @param newBaseName New base (i.e. file) name
 * @returns Full path with the renamed file
 */
export function rename(path: string, newBaseName: string): string {
  const pathList = toPathList(path);
  pathList.push(newBaseName);
  return pathList.join('/');
}
