import { DOMElementNode, DOMElementNodeImpl, DOMTextNodeImpl, SelectorMap } from './views';
import { timeExecutionSync } from '../utils';

export class DOMService {
  @timeExecutionSync('Parse DOM')
  parseDOM(): DOMElementNode {
    // This is a mock implementation
    // In a real implementation, this would parse the DOM string into a tree
    return new DOMElementNodeImpl(
      true,
      null,
      'html',
      '/html',
      {},
      [new DOMTextNodeImpl(true, null, 'Mock DOM')],
      false,
      true,
      false,
      null
    );
  }

  @timeExecutionSync('Create selector map')
  createSelectorMap(root: DOMElementNode): SelectorMap {
    const selectorMap: SelectorMap = {};
    let currentIndex = 1;

    const processNode = (node: DOMElementNode) => {
      if (node.isInteractive) {
        selectorMap[currentIndex] = node;
        currentIndex++;
      }

      for (const child of node.children) {
        if ('tagName' in child) {
          processNode(child);
        }
      }
    };

    processNode(root);
    return selectorMap;
  }

  @timeExecutionSync('Find element by index')
  findElementByIndex(root: DOMElementNode, index: number): DOMElementNode | null {
    if (root.highlightIndex === index) {
      return root;
    }

    for (const child of root.children) {
      if ('tagName' in child) {
        const result = this.findElementByIndex(child, index);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  @timeExecutionSync('Get element text')
  getElementText(element: DOMElementNode): string {
    return element.getAllTextTillNextClickableElement();
  }

  @timeExecutionSync('Is element visible')
  isElementVisible(element: DOMElementNode): boolean {
    return element.isVisible;
  }

  @timeExecutionSync('Get element attributes')
  getElementAttributes(element: DOMElementNode): Record<string, string> {
    return element.attributes;
  }
}
