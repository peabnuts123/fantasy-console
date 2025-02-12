/**
 * Generic function for converting a list of hierarchical assets into a view
 * of a given virtual directory.
 * @param items List of items to process.
 * @param cwd  The "current working directory" i.e. path we're trying to view in the data.
 * @param toPath Convert an item into a path represented as a string[].
 * @param toFile Convert an item into the desired "file" type.
 * @param toDirectory Convert an item into the desired "directory" type.
 */
export function createDirView<TItem, TFile, TDirectory>(
  items: TItem[],
  cwd: string[],
  toPath: (item: TItem) => string[],
  toFile: (item: TItem) => TFile,
  toDirectory: (directoryName: string, item: TItem) => TDirectory,
): (TFile | TDirectory)[] {
  // Find all items that are at this node or below
  const itemsMatchingPrefix = items.filter((item) => {
    for (let i = 0; i < cwd.length; i++) {
      const itemPath = toPath(item);
      if (itemPath[i] != cwd[i]) {
        return false;
      }
    }

    return true;
  });

  // Map nodes into files and directories that are inside this path
  const files: TFile[] = [];
  const directories: TDirectory[] = [];
  const alreadyProcessedSubDirectories: string[] = [];

  itemsMatchingPrefix.forEach((item) => {
    const itemPath = toPath(item).slice(cwd.length);

    if (itemPath.length === 0) {
      // Item is a file directly in the directory
      files.push(toFile(item));
    } else {
      // Item is a file nested within a subdirectory somewhere
      const subDirectoryName = itemPath[0];

      // Check if we already know about this directory first
      // e.g. multiple files in a subdirectory will all have the same parent
      if (!alreadyProcessedSubDirectories.includes(subDirectoryName)) {
        alreadyProcessedSubDirectories.push(subDirectoryName);
        directories.push(toDirectory(subDirectoryName, item));
      }
    }
  });

  return [
    ...directories,
    ...files,
  ];
}

/**
 * Convert a given string to a "safe" file name.
 * That is, not necessarily anything "reasonable", but not overtly
 * forbidden by common filesystems.
 */
export function convertToSafeFileName(s: string): string {
  // @NOTE Remove characters that will make FS go brrrrr
  // Might need to be more restrictive with this later
  return s.replace(/[\/:*?"<>|]/g, '');
}
