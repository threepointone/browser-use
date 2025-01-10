// Logger setup
const logger = {
  debug: (message: string) => console.debug(message),
  info: (message: string) => console.info(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message)
};

// Generic type for function parameters and return type
type AnyFunction = (...args: any[]) => any;

// Time execution decorator for synchronous functions
export function timeExecutionSync(additionalText: string = '') {
  return function <T extends AnyFunction>(target: T): T {
    return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
      const startTime = Date.now();
      const result = target.apply(this as any, args);
      const executionTime = (Date.now() - startTime) / 1000;
      logger.debug(`${additionalText} Execution time: ${executionTime.toFixed(2)} seconds`);
      return result;
    } as T;
  };
}

// Time execution decorator for async functions
export function timeExecutionAsync(additionalText: string = '') {
  return function <T extends (...args: any[]) => Promise<any>>(target: T): T {
    return async function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
      const startTime = Date.now();
      const result = await target.apply(this as any, args);
      const executionTime = (Date.now() - startTime) / 1000;
      logger.debug(`${additionalText} Execution time: ${executionTime.toFixed(2)} seconds`);
      return result;
    } as T;
  };
}

// Singleton decorator
export function singleton<T extends { new (...args: any[]): InstanceType<T> }>(constructor: T): T {
  let instance: InstanceType<T> | null = null;

  // Create a wrapper constructor function
  const wrapper = function (this: any, ...args: any[]) {
    if (!instance) {
      instance = new constructor(...args);
    }
    return instance;
  } as unknown as T;

  // Copy prototype and static properties
  wrapper.prototype = constructor.prototype;
  return Object.assign(wrapper, constructor);
}
