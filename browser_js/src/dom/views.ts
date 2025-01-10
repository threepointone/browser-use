import { HashedDomElement } from './history_tree_processor/view';
import { HistoryTreeProcessor } from './history_tree_processor/service';

export interface DOMBaseNode {
  isVisible: boolean;
  parent: DOMElementNode | null;
  toJSON(): Record<string, any>;
}

export interface DOMTextNode extends DOMBaseNode {
  text: string;
  type: 'TEXT_NODE';

  hasParentWithHighlightIndex(): boolean;
}

export class DOMTextNodeImpl implements DOMTextNode {
  isVisible: boolean;
  parent: DOMElementNode | null;
  text: string;
  type: 'TEXT_NODE' = 'TEXT_NODE' as const;

  constructor(isVisible: boolean, parent: DOMElementNode | null, text: string) {
    this.isVisible = isVisible;
    this.parent = parent;
    this.text = text;
  }

  hasParentWithHighlightIndex(): boolean {
    let current = this.parent;
    while (current !== null) {
      if (current.highlightIndex !== null) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  toJSON(): Record<string, any> {
    return {
      type: 'text',
      text: this.text,
      isVisible: this.isVisible
    };
  }
}

export interface DOMElementNode extends DOMBaseNode {
  tagName: string;
  xpath: string;
  attributes: Record<string, string>;
  children: (DOMElementNode | DOMTextNode)[];
  isInteractive: boolean;
  isTopElement: boolean;
  shadowRoot: boolean;
  highlightIndex: number | null;

  hash(): HashedDomElement;
  getAllTextTillNextClickableElement(): string;
  clickableElementsToString(options: { includeAttributes: string[] }): string;
  getFileUploadElement(checkSiblings?: boolean): DOMElementNode | null;
  toJSON(): Record<string, any>;
}

export class DOMElementNodeImpl implements DOMElementNode {
  isVisible: boolean;
  parent: DOMElementNode | null;
  tagName: string;
  xpath: string;
  attributes: Record<string, string>;
  children: (DOMElementNode | DOMTextNode)[];
  isInteractive: boolean;
  isTopElement: boolean;
  shadowRoot: boolean;
  highlightIndex: number | null;

  constructor(
    isVisible: boolean,
    parent: DOMElementNode | null,
    tagName: string,
    xpath: string,
    attributes: Record<string, string>,
    children: (DOMElementNode | DOMTextNode)[],
    isInteractive: boolean = false,
    isTopElement: boolean = false,
    shadowRoot: boolean = false,
    highlightIndex: number | null = null
  ) {
    this.isVisible = isVisible;
    this.parent = parent;
    this.tagName = tagName;
    this.xpath = xpath;
    this.attributes = attributes;
    this.children = children;
    this.isInteractive = isInteractive;
    this.isTopElement = isTopElement;
    this.shadowRoot = shadowRoot;
    this.highlightIndex = highlightIndex;
  }

  toString(): string {
    let tagStr = `<${this.tagName}`;

    // Add attributes
    for (const [key, value] of Object.entries(this.attributes)) {
      tagStr += ` ${key}="${value}"`;
    }
    tagStr += '>';

    // Add extra info
    const extras: string[] = [];
    if (this.isInteractive) extras.push('interactive');
    if (this.isTopElement) extras.push('top');
    if (this.shadowRoot) extras.push('shadow-root');
    if (this.highlightIndex !== null) extras.push(`highlight:${this.highlightIndex}`);

    if (extras.length > 0) {
      tagStr += ` [${extras.join(', ')}]`;
    }

    return tagStr;
  }

  hash(): HashedDomElement {
    return HistoryTreeProcessor.hashDomElement(this);
  }

  getAllTextTillNextClickableElement(): string {
    const textParts: string[] = [];

    const collectText = (node: DOMBaseNode): void => {
      if (node instanceof DOMElementNodeImpl && node !== this && node.highlightIndex !== null) {
        return;
      }

      if (node instanceof DOMTextNodeImpl) {
        textParts.push(node.text);
      } else if (node instanceof DOMElementNodeImpl) {
        for (const child of node.children) {
          collectText(child);
        }
      }
    };

    collectText(this);
    return textParts.join('\n').trim();
  }

  clickableElementsToString({ includeAttributes = [] }: { includeAttributes: string[] }): string {
    const formattedText: string[] = [];

    const processNode = (node: DOMBaseNode, depth: number): void => {
      if (node instanceof DOMElementNodeImpl) {
        if (node.highlightIndex !== null) {
          let attributesStr = '';
          if (includeAttributes.length > 0) {
            attributesStr =
              ' ' +
              includeAttributes
                .map((key) => (node.attributes[key] ? `${key}="${node.attributes[key]}"` : ''))
                .filter(Boolean)
                .join(' ');
          }
          formattedText.push(
            `${node.highlightIndex}[:]<${
              node.tagName
            }${attributesStr}>${node.getAllTextTillNextClickableElement()}</${node.tagName}>`
          );
        }

        for (const child of node.children) {
          processNode(child, depth + 1);
        }
      } else if (node instanceof DOMTextNodeImpl) {
        if (!node.hasParentWithHighlightIndex()) {
          formattedText.push(`_[:]${node.text}`);
        }
      }
    };

    processNode(this, 0);
    return formattedText.join('\n');
  }

  getFileUploadElement(checkSiblings: boolean = true): DOMElementNode | null {
    if (this.tagName === 'input' && this.attributes['type'] === 'file') {
      return this;
    }

    for (const child of this.children) {
      if (child instanceof DOMElementNodeImpl) {
        const result = child.getFileUploadElement(false);
        if (result) return result;
      }
    }

    if (checkSiblings && this.parent) {
      for (const sibling of this.parent.children) {
        if (sibling !== this && sibling instanceof DOMElementNodeImpl) {
          const result = sibling.getFileUploadElement(false);
          if (result) return result;
        }
      }
    }

    return null;
  }

  toJSON(): Record<string, any> {
    return {
      type: 'element',
      tagName: this.tagName,
      attributes: this.attributes,
      highlightIndex: this.highlightIndex,
      children: this.children.map((child) =>
        child instanceof DOMTextNodeImpl ? { type: 'text', text: child.text } : child.toJSON()
      )
    };
  }
}

export interface ElementTreeSerializer {
  serializeClickableElements(elementTree: DOMElementNode): string;
  domElementNodeToJSON(elementTree: DOMElementNode): Record<string, any>;
}

export class ElementTreeSerializerImpl implements ElementTreeSerializer {
  serializeClickableElements(elementTree: DOMElementNode): string {
    return elementTree.clickableElementsToString({ includeAttributes: [] });
  }

  domElementNodeToJSON(elementTree: DOMElementNode): Record<string, any> {
    return elementTree.toJSON();
  }
}

export type SelectorMap = Record<number, DOMElementNode>;

export interface DOMState {
  elementTree: DOMElementNode;
  selectorMap: SelectorMap;
}
