import { BrowserStateHistory } from '../browser/views';
import { ActionModel } from '../controller/registry/views';
import { DOMHistoryElement } from '../dom/history_tree_processor/service';
import { SelectorMap } from '../dom/views';

export { ActionModel };

export interface AgentStepInfo {
  stepNumber: number;
  maxSteps: number;
}

export interface ActionResult {
  isDone?: boolean;
  extractedContent?: string;
  error?: string;
  includeInMemory: boolean;
}

export interface AgentBrain {
  evaluationPreviousGoal: string;
  memory: string;
  nextGoal: string;
}

export interface AgentOutput {
  currentState: AgentBrain;
  action: ActionModel[];
}

export interface AgentHistory {
  modelOutput: AgentOutput | null;
  result: ActionResult[];
  state: BrowserStateHistory;

  getInteractedElement(
    modelOutput: AgentOutput,
    selectorMap: SelectorMap
  ): (DOMHistoryElement | null)[];
  toJSON(): Record<string, any>;
}

export class AgentHistoryList {
  history: AgentHistory[];

  constructor(history: AgentHistory[]) {
    this.history = history;
  }

  toString(): string {
    return `AgentHistoryList(allResults=${JSON.stringify(
      this.actionResults()
    )}, allModelOutputs=${JSON.stringify(this.modelActions())})`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveToFile(filepath: string): void {
    // eslint-disable-next-line no-useless-catch
    try {
      // Note: In browser environment, this would need to be adapted to use the File System API
      const data = this.toJSON();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const json = JSON.stringify(data, null, 2);
      // Implementation would depend on the environment (Node.js vs Browser)
      // For Node.js:
      // require('fs').writeFileSync(filepath, json, 'utf-8');
    } catch (e) {
      throw e;
    }
  }

  toJSON(): Record<string, any> {
    return {
      history: this.history.map((h) => h.toJSON())
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static loadFromFile(filepath: string): AgentHistoryList {
    // Implementation would depend on the environment (Node.js vs Browser)
    // For Node.js:
    // const data = JSON.parse(require('fs').readFileSync(filepath, 'utf-8'));
    // return new AgentHistoryList(data.history);
    throw new Error('Not implemented');
  }

  lastAction(): Record<string, any> | null {
    if (this.history.length && this.history[this.history.length - 1].modelOutput) {
      const actions = this.history[this.history.length - 1].modelOutput!.action;
      return actions[actions.length - 1].toJSON();
    }
    return null;
  }

  errors(): string[] {
    return this.history
      .flatMap((h) => h.result)
      .filter((r) => r.error)
      .map((r) => r.error!);
  }

  finalResult(): string | null {
    if (this.history.length && this.history[this.history.length - 1].result.length) {
      return (
        this.history[this.history.length - 1].result[
          this.history[this.history.length - 1].result.length - 1
        ].extractedContent || null
      );
    }
    return null;
  }

  isDone(): boolean {
    if (
      this.history.length &&
      this.history[this.history.length - 1].result.length &&
      this.history[this.history.length - 1].result[
        this.history[this.history.length - 1].result.length - 1
      ].isDone
    ) {
      return true;
    }
    return false;
  }

  hasErrors(): boolean {
    return this.errors().length > 0;
  }

  urls(): string[] {
    return this.history.filter((h) => h.state.url).map((h) => h.state.url!);
  }

  screenshots(): string[] {
    return this.history.filter((h) => h.state.screenshot).map((h) => h.state.screenshot!);
  }

  actionNames(): string[] {
    return this.modelActions().map((action) => Object.keys(action)[0]);
  }

  modelThoughts(): AgentBrain[] {
    return this.history.filter((h) => h.modelOutput).map((h) => h.modelOutput!.currentState);
  }

  modelOutputs(): AgentOutput[] {
    return this.history.filter((h) => h.modelOutput).map((h) => h.modelOutput!);
  }

  modelActions(): Record<string, any>[] {
    return this.history
      .filter((h) => h.modelOutput)
      .flatMap((h) => h.modelOutput!.action.map((action) => action.toJSON()));
  }

  actionResults(): ActionResult[] {
    return this.history.flatMap((h) => h.result);
  }

  extractedContent(): string[] {
    return this.history
      .flatMap((h) => h.result)
      .filter((r) => r.extractedContent)
      .map((r) => r.extractedContent!);
  }

  modelActionsFiltered(include: string[] = []): Record<string, any>[] {
    const outputs = this.modelActions();
    return outputs.filter((o) => {
      const actionName = Object.keys(o)[0];
      return include.includes(actionName);
    });
  }
}

export class AgentError {
  static readonly VALIDATION_ERROR =
    'Invalid model output format. Please follow the correct schema.';
  static readonly RATE_LIMIT_ERROR = 'Rate limit reached. Waiting before retry.';
  static readonly NO_VALID_ACTION = 'No valid action found';

  static formatError(error: Error, includeTrace: boolean = false): string {
    if (includeTrace) {
      return `${error.message}\n${error.stack || ''}`;
    }
    return error.message;
  }
}
