import { FieldSchema, FieldArgSchema } from "field";

const DocSymb= Symbol('RESP-MODEL DOC');


/** Document decorator */
export function doc(schema?: FieldSchema | string){
	// Schema
	if(!(schema instanceof FieldSchema))
		schema= new FieldSchema({comment: schema});
	// Apply
	return function <T extends { new (...args: any[]): {} }>(constructor: T){
		type constType= {[DocSymb]?: FieldArgSchema};
		(constructor as constType)[DocSymb]= (schema as FieldSchema).build((constructor as constType)[DocSymb], (Reflect.getPrototypeOf(constructor) as constType)[DocSymb]);
	}
}


// /** Input document only */
// export function inputDoc(target: any){
// 	//TODO
// }
