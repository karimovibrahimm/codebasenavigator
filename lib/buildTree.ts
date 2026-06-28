import type { ProjectFile, TreeNode } from "./types";

/** Builds a nested folder/file tree from a flat list of files. */
export function buildTree(files: ProjectFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", type: "folder", children: [] };

  files.forEach((file, fileIndex) => {
    const segments = file.path.split("/");
    let current = root;

    segments.forEach((segment, i) => {
      const isLeaf = i === segments.length - 1;
      const path = segments.slice(0, i + 1).join("/");

      if (isLeaf) {
        current.children!.push({
          name: segment,
          path,
          type: "file",
          fileIndex,
        });
        return;
      }

      let folder = current.children!.find(
        (c) => c.type === "folder" && c.name === segment
      );
      if (!folder) {
        folder = { name: segment, path, type: "folder", children: [] };
        current.children!.push(folder);
      }
      current = folder;
    });
  });

  sortTree(root);
  return root;
}

/** Folders before files, each group alphabetical. */
function sortTree(node: TreeNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  node.children.forEach(sortTree);
}
