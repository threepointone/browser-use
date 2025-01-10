import { createHash } from 'crypto';
import { DOMElementNode } from '../views';
import { DOMHistoryElement, DOMHistoryElementImpl, HashedDomElement } from './view';

export { DOMElementNode, DOMHistoryElement };

export class HistoryTreeProcessor {
  static convertDomElementToHistoryElement(domElement: DOMElementNode): DOMHistoryElement {
    const parentBranchPath = HistoryTreeProcessor.getParentBranchPath(domElement);
    return new DOMHistoryElementImpl(
      domElement.tagName,
      domElement.xpath,
      domElement.highlightIndex,
      parentBranchPath,
      domElement.attributes,
      domElement.shadowRoot
    );
  }

  static findHistoryElementInTree(
    domHistoryElement: DOMHistoryElement,
    tree: DOMElementNode
  ): DOMElementNode | null {
    const hashedDomHistoryElement = HistoryTreeProcessor.hashDomHistoryElement(domHistoryElement);

    const processNode = (node: DOMElementNode): DOMElementNode | null => {
      if (node.highlightIndex !== null) {
        const hashedNode = HistoryTreeProcessor.hashDomElement(node);
        if (
          hashedNode.branchPathHash === hashedDomHistoryElement.branchPathHash &&
          hashedNode.attributesHash === hashedDomHistoryElement.attributesHash
        ) {
          return node;
        }
      }
      for (const child of node.children) {
        if ('tagName' in child) {
          // Type guard for DOMElementNode
          const result = processNode(child);
          if (result !== null) {
            return result;
          }
        }
      }
      return null;
    };

    return processNode(tree);
  }

  static compareHistoryElementAndDomElement(
    domHistoryElement: DOMHistoryElement,
    domElement: DOMElementNode
  ): boolean {
    const hashedDomHistoryElement = HistoryTreeProcessor.hashDomHistoryElement(domHistoryElement);
    const hashedDomElement = HistoryTreeProcessor.hashDomElement(domElement);

    return (
      hashedDomHistoryElement.branchPathHash === hashedDomElement.branchPathHash &&
      hashedDomHistoryElement.attributesHash === hashedDomElement.attributesHash
    );
  }

  static hashDomHistoryElement(domHistoryElement: DOMHistoryElement): HashedDomElement {
    const branchPathHash = HistoryTreeProcessor.parentBranchPathHash(
      domHistoryElement.entireParentBranchPath
    );
    const attributesHash = HistoryTreeProcessor.attributesHash(domHistoryElement.attributes);

    return {
      branchPathHash,
      attributesHash
    };
  }

  static hashDomElement(domElement: DOMElementNode): HashedDomElement {
    const parentBranchPath = HistoryTreeProcessor.getParentBranchPath(domElement);
    const branchPathHash = HistoryTreeProcessor.parentBranchPathHash(parentBranchPath);
    const attributesHash = HistoryTreeProcessor.attributesHash(domElement.attributes);

    return {
      branchPathHash,
      attributesHash
    };
  }

  static getParentBranchPath(domElement: DOMElementNode): string[] {
    const parents: DOMElementNode[] = [];
    let currentElement: DOMElementNode | null = domElement;

    while (currentElement.parent !== null) {
      parents.push(currentElement);
      currentElement = currentElement.parent;
    }

    parents.reverse();
    return parents.map((parent) => parent.tagName);
  }

  private static parentBranchPathHash(parentBranchPath: string[]): string {
    const parentBranchPathString = parentBranchPath.join('/');
    return createHash('sha256').update(parentBranchPathString).digest('hex');
  }

  private static attributesHash(attributes: Record<string, string>): string {
    const attributesString = Object.entries(attributes)
      .map(([key, value]) => `${key}=${value}`)
      .join('');
    return createHash('sha256').update(attributesString).digest('hex');
  }

  private static textHash(domElement: DOMElementNode): string {
    const textString = domElement.getAllTextTillNextClickableElement();
    return createHash('sha256').update(textString).digest('hex');
  }
}
