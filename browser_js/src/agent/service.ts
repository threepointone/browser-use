import { BrowserState } from '../browser/views';
import { timeExecutionAsync } from '../utils';
import { AgentHistory, AgentHistoryList, AgentOutput, ActionResult } from './views';
import { AgentMessagePrompt, SystemPrompt } from './prompts';
// import { DOMHistoryElement } from '../dom/history_tree_processor/service';
import { SelectorMap } from '../dom/views';

export interface AgentConfig {
  maxSteps: number;
  maxActionsPerStep: number;
  includeAttributes?: string[];
}

export class Agent {
  private readonly config: AgentConfig;
  private readonly systemPrompt: SystemPrompt;
  private history: AgentHistoryList;
  private currentStep: number;

  constructor(actionDescription: string, config: AgentConfig) {
    this.config = {
      maxSteps: config.maxSteps,
      maxActionsPerStep: config.maxActionsPerStep,
      includeAttributes: config.includeAttributes || []
    };
    this.systemPrompt = new SystemPrompt(actionDescription, new Date(), config.maxActionsPerStep);
    this.history = new AgentHistoryList([]);
    this.currentStep = 0;
  }

  @timeExecutionAsync('Agent step execution')
  async step(browserState: BrowserState): Promise<AgentOutput> {
    if (this.currentStep >= this.config.maxSteps) {
      throw new Error('Maximum number of steps reached');
    }

    const messagePrompt = new AgentMessagePrompt(
      browserState,
      this.history.history.length > 0
        ? this.history.history[this.history.history.length - 1].result
        : undefined,
      this.config.includeAttributes,
      400,
      { stepNumber: this.currentStep, maxSteps: this.config.maxSteps }
    );

    // Use the message prompt to get the next action from the LLM
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _systemMessage = this.systemPrompt.getSystemMessage();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _userMessage = messagePrompt.getUserMessage();

    // In a real implementation, this would call an LLM to get the next action
    // For now, we'll return a mock response
    const mockOutput: AgentOutput = {
      currentState: {
        evaluationPreviousGoal: 'Success',
        memory: 'Mock memory',
        nextGoal: 'Mock next goal'
      },
      action: []
    };

    this.currentStep++;
    return mockOutput;
  }

  addResult(result: ActionResult[]): void {
    if (this.history.history.length === 0) {
      throw new Error('No history to add result to');
    }
    this.history.history[this.history.history.length - 1].result = result;
  }

  addModelOutput(output: AgentOutput): void {
    const historyItem: AgentHistory = {
      modelOutput: output,
      result: [],
      state: {
        url: '',
        title: '',
        tabs: [],
        interactedElement: [],
        screenshot: undefined,
        toJSON: () => ({
          url: '',
          title: '',
          tabs: [],
          interactedElement: [],
          screenshot: undefined
        })
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getInteractedElement: (modelOutput: AgentOutput, selectorMap: SelectorMap) => {
        // Mock implementation
        return modelOutput.action.map(() => null);
      },
      toJSON: () => ({
        modelOutput: output,
        result: [],
        state: {
          url: '',
          title: '',
          tabs: [],
          interactedElement: [],
          screenshot: undefined
        }
      })
    };
    this.history.history.push(historyItem);
  }

  getHistory(): AgentHistoryList {
    return this.history;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getMaxSteps(): number {
    return this.config.maxSteps;
  }

  getSystemPrompt(): SystemPrompt {
    return this.systemPrompt;
  }
}
