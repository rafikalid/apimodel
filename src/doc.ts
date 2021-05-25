// import { FieldSchema, FieldArgSchema } from "./field";
import { DocSymb } from "./symbols";

/** Document decorator */
export function doc(comment?: string){
	// Apply
	return function <T extends { new (...args: any[]): {} }>(constructor: T){
		type constType= {[DocSymb]?: string};
		(constructor as constType)[DocSymb]= comment;
	}
}


// /** Input document only */
// export function inputDoc(target: any){
// 	//TODO
// }
