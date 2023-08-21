function validate(...validators: Function[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const action = target[propertyKey];
    descriptor.value = function(...args: any[]) {
      // create arg dict like {username: <actual value>, session: <actual value>}
      for (const validator of validators) {
        // get arg dict for this validator, make sure values exist
        const correctedArgs = [1, 2, 3];
        validator.call(this, correctedArgs);
      }
      action.call(this, args);
    }
  };
}