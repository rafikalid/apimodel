/**
 * Agrument
 * @param {Function} docType  - Class generating the arg type
 */
export function arg(docType: Function){
	return function<T>(target: T, propertyKey: string | symbol, parameterIndex: number){}
}
