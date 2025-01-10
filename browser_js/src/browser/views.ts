import { DOMHistoryElement } from '../dom/history_tree_processor/service';
import { DOMState } from '../dom/views';

export interface TabInfo {
  pageId: number;
  url: string;
  title: string;
}

export interface BrowserState extends DOMState {
  url: string;
  title: string;
  tabs: TabInfo[];
  screenshot?: string;
}

export interface BrowserStateHistory {
  url: string;
  title: string;
  tabs: TabInfo[];
  interactedElement: (DOMHistoryElement | null)[];
  screenshot?: string;

  toJSON(): Record<string, any>;
}

export class BrowserStateHistoryImpl implements BrowserStateHistory {
  url: string;
  title: string;
  tabs: TabInfo[];
  interactedElement: (DOMHistoryElement | null)[];
  screenshot?: string;

  constructor(
    url: string,
    title: string,
    tabs: TabInfo[],
    interactedElement: (DOMHistoryElement | null)[],
    screenshot?: string
  ) {
    this.url = url;
    this.title = title;
    this.tabs = tabs;
    this.interactedElement = interactedElement;
    this.screenshot = screenshot;
  }

  toJSON(): Record<string, any> {
    return {
      tabs: this.tabs,
      screenshot: this.screenshot,
      interactedElement: this.interactedElement.map((el) => (el ? el.toJSON() : null)),
      url: this.url,
      title: this.title
    };
  }
}

export class BrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserError';
  }
}
