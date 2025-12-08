export interface MindmapNode {
  text: string;
  definition?: string;
  children?: MindmapNode[];
}

export interface MindmapData {
  root: MindmapNode;
}

