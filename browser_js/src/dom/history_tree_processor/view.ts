export interface HashedDomElement {
  branchPathHash: string;
  attributesHash: string;
}

export interface DOMHistoryElement {
  tagName: string;
  xpath: string;
  highlightIndex: number | null;
  entireParentBranchPath: string[];
  attributes: Record<string, string>;
  shadowRoot: boolean;

  toJSON(): Record<string, any>;
}

export class DOMHistoryElementImpl implements DOMHistoryElement {
  tagName: string;
  xpath: string;
  highlightIndex: number | null;
  entireParentBranchPath: string[];
  attributes: Record<string, string>;
  shadowRoot: boolean;

  constructor(
    tagName: string,
    xpath: string,
    highlightIndex: number | null,
    entireParentBranchPath: string[],
    attributes: Record<string, string>,
    shadowRoot: boolean = false
  ) {
    this.tagName = tagName;
    this.xpath = xpath;
    this.highlightIndex = highlightIndex;
    this.entireParentBranchPath = entireParentBranchPath;
    this.attributes = attributes;
    this.shadowRoot = shadowRoot;
  }

  toJSON(): Record<string, any> {
    return {
      tagName: this.tagName,
      xpath: this.xpath,
      highlightIndex: this.highlightIndex,
      entireParentBranchPath: this.entireParentBranchPath,
      attributes: this.attributes,
      shadowRoot: this.shadowRoot
    };
  }
}
