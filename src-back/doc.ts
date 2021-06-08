import { ClassFields } from "./graphql-wr";
import { DocSymb } from "./symbols";

/**
 * Add metadata to entities
 */
export function doc(comment: string){
	return function(constructor: ClassFields){
		constructor[DocSymb]= comment;
	}
}