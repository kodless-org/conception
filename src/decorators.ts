import { ActionOptions } from "conceptRouter";

export function action(actionName: string, options?: ActionOptions){

  return function(target: Function, context: ClassMethodDecoratorContext){
    context.addInitializer(function(){
      if (actionName in this.actions) {
        throw new Error(`Action ${actionName} already defined in ${this.name} concept!`);
      }
      this.actions[actionName] = target;
      if (options) this.options[actionName] = options;    
    })
  }
}


type HTTPRequest = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export function route(requestType: HTTPRequest, path: string, actionName: string){
  
  return function<T extends { new (...args: any[]): {} }>( target: T, context: ClassDecoratorContext){
    return class extends target{
      constructor(...args: any[]){
        super(args);
        this.router[requestType](path, this.handlers(actionName));
      }
    }

  }
}
