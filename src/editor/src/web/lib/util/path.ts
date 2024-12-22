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
) {
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
  let files: TFile[] = [];
  let directories: TDirectory[] = [];
  let alreadyProcessedSubDirectories: string[] = [];

  itemsMatchingPrefix.forEach((item) => {
    let itemPath = toPath(item).slice(cwd.length);

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