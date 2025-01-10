import { Browser } from '../browser/browser';
import { ActionModel, ActionRegistry, RegisteredActionImpl } from './registry/views';
import { timeExecutionAsync } from '../utils';
import { DOMService } from '../dom/service';

export class Controller {
  private browser: Browser;
  private domService: DOMService;
  private actionRegistry: ActionRegistry;

  constructor(browser: Browser) {
    this.browser = browser;
    this.domService = new DOMService();
    this.actionRegistry = new ActionRegistry();
    this.registerDefaultActions();
  }

  @timeExecutionAsync('Execute action')
  async executeAction(action: ActionModel): Promise<any> {
    const actionName = Object.keys(action.toJSON())[0];
    const registeredAction = this.actionRegistry.getAction(actionName);

    if (!registeredAction) {
      throw new Error(`Unknown action: ${actionName}`);
    }

    if (registeredAction.requiresBrowser && !this.browser) {
      throw new Error('Browser required but not available');
    }

    return registeredAction.function(action.toJSON()[actionName]);
  }

  private registerDefaultActions(): void {
    // Register click action
    this.registerAction(
      new RegisteredActionImpl(
        'click_element',
        'Click on an element',
        async (params: { index: number }) => {
          // Mock implementation
          console.log(`Clicking element with index ${params.index}`);
        },
        {
          schema: {
            properties: {
              index: { type: 'number', description: 'Element index to click' }
            }
          }
        },
        true
      )
    );

    // Register input text action
    this.registerAction(
      new RegisteredActionImpl(
        'input_text',
        'Input text into a field',
        async (params: { index: number; text: string }) => {
          // Mock implementation
          console.log(`Inputting text "${params.text}" into element with index ${params.index}`);
        },
        {
          schema: {
            properties: {
              index: { type: 'number', description: 'Element index to input text' },
              text: { type: 'string', description: 'Text to input' }
            }
          }
        },
        true
      )
    );
  }

  registerAction(action: RegisteredActionImpl): void {
    this.actionRegistry.registerAction(action);
  }

  getActionRegistry(): ActionRegistry {
    return this.actionRegistry;
  }
}
