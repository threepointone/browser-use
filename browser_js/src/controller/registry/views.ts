export interface RegisteredAction {
  name: string;
  description: string;
  function: (...args: any[]) => any;
  paramModel: any;
  requiresBrowser: boolean;

  promptDescription(): string;
}

export class RegisteredActionImpl implements RegisteredAction {
  name: string;
  description: string;
  function: (...args: any[]) => any;
  paramModel: any;
  requiresBrowser: boolean;

  constructor(
    name: string,
    description: string,
    func: (...args: any[]) => any,
    paramModel: any,
    requiresBrowser: boolean = false
  ) {
    this.name = name;
    this.description = description;
    this.function = func;
    this.paramModel = paramModel;
    this.requiresBrowser = requiresBrowser;
  }

  promptDescription(): string {
    const skipKeys = ['title'];
    let s = `${this.description}: \n`;
    s += '{' + this.name + ': ';
    s += JSON.stringify(
      Object.fromEntries(
        Object.entries(this.paramModel.schema.properties || {}).map(([k, v]) => [
          k,
          Object.fromEntries(
            Object.entries(v as Record<string, any>).filter(([key]) => !skipKeys.includes(key))
          )
        ])
      )
    );
    s += '}';
    return s;
  }
}

export interface ActionModel {
  toJSON(): Record<string, any>;
  getIndex(): number | null;
  setIndex(index: number): void;
}

export class ActionModelImpl implements ActionModel {
  private data: Record<string, any>;

  constructor(data: Record<string, any>) {
    this.data = data;
  }

  toJSON(): Record<string, any> {
    return this.data;
  }

  getIndex(): number | null {
    const params = Object.values(this.data)[0];
    if (params && typeof params === 'object' && 'index' in params) {
      return params.index as number;
    }
    return null;
  }

  setIndex(index: number): void {
    const actionName = Object.keys(this.data)[0];
    const params = this.data[actionName];
    if (params && typeof params === 'object' && 'index' in params) {
      params.index = index;
    }
  }
}

export class ActionRegistry {
  private actions: Map<string, RegisteredAction>;

  constructor() {
    this.actions = new Map();
  }

  registerAction(action: RegisteredAction): void {
    this.actions.set(action.name, action);
  }

  getAction(name: string): RegisteredAction | undefined {
    return this.actions.get(name);
  }

  getPromptDescription(): string {
    return Array.from(this.actions.values())
      .map((action) => action.promptDescription())
      .join('\n');
  }
}
