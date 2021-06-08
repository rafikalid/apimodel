import { FieldSchema } from "./schema";
import type { FieldArgSchema, ClassType, FieldDescriptor } from "./schema";
import { fieldSymb } from "./symbols";

/** Generate field schema */
function field(schema: FieldArgSchema, comment?: string): Function;
function field(schema: FieldArgSchema, modifier: FieldSchema, comment?: string): Function;
function field(schema: FieldArgSchema, modifier?: FieldSchema|string, comment?: string){
	return function(target: any, propertyKey: string){
		// Create class descriptor
		var constructor=  (typeof target === 'function'? target : target.constructor) as ClassType;
		var fields= constructor[fieldSymb];
		if(fields==null){
			fields= constructor[fieldSymb]= new Map();
			var parentFields= (Reflect.getPrototypeOf(constructor) as ClassType)[fieldSymb];
			if(parentFields)
				parentFields.forEach((v:FieldSchema, k:string)=> {fields!.set(k, v)});
		}
		// Create field descriptor
		var prevSkm= fields.get(propertyKey);
		var s= prevSkm==null ? new FieldSchema({name: propertyKey}) : new FieldSchema().type(prevSkm);
		s.type(schema); // apply new schema
		if(modifier instanceof FieldSchema){
			s.type(modifier);
			if(typeof comment === 'string') s.comment(comment);
		}
		else if(typeof modifier==='string')
			s.comment(modifier);
		fields.set(propertyKey, s);
	}
}

/** Required filed */
function requiredField(schema: FieldArgSchema, comment?: string): Function;
function requiredField(schema: FieldArgSchema, modifier: FieldSchema, comment?: string): Function;
function requiredField(schema: FieldArgSchema, modifier?: FieldSchema|string, comment?: string){
	schema= new FieldSchema().type(schema);
	schema.required;
	if(modifier instanceof FieldSchema) schema.type(modifier);
	else if(typeof modifier=== 'string') comment= modifier;
	return field(schema, comment);
}

/** Argument */
export function arg(schema: FieldArgSchema, comment?: string){
	return function(target: any, propertyKey: string, parameterIndex: number){
		if(parameterIndex!= 1)
			throw new Error(`@arg expected to be used on second argument only! used at arg: ${propertyKey}`);
		// prepare
		if(!(schema instanceof FieldSchema)) schema= new FieldSchema().type(schema);
		//Apply descriptor
		field(new FieldSchema({args: schema}))(target, propertyKey);
	}
}