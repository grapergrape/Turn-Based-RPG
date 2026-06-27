export function installGameMethods(targetClass, sourceClass) {
  for (const name of Object.getOwnPropertyNames(sourceClass.prototype)) {
    if (name === 'constructor') continue;
    const descriptor = Object.getOwnPropertyDescriptor(sourceClass.prototype, name);
    Object.defineProperty(targetClass.prototype, name, descriptor);
  }
}
