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
