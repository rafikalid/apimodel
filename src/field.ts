import { EntityDescriptor, FieldMergeArg, FieldResolverArgSchema, FieldSchema } from "./schema";
import type { FieldArgSchema, ClassType, FieldDescriptor } from "./schema";
import { fieldSymb } from "./symbols";

/** Generate field schema */
export function field(schema: FieldArgSchema, comment?: string): Function;
export function field(schema: FieldArgSchema, modifier: FieldSchema, comment?: string): Function;
export function field(schema: FieldArgSchema, modifier?: FieldSchema|string, comment?: string){
	return function(target: any, propertyKey: string){
		// Create class descriptor
		var constructor=  (typeof target === 'function'? target : target.constructor) as ClassType;
		var fields:Map<string, FieldSchema>;
		if(typeof constructor[fieldSymb] === 'undefined'){
			fields = new Map();
			constructor[fieldSymb]= {
				name:		constructor.name,
				comment:	'', //TODO add comments to the entity
				fields:		fields
			};
			var parentFields= (Reflect.getPrototypeOf(constructor) as ClassType)[fieldSymb];
			if(parentFields)
				parentFields.fields.forEach((v:FieldSchema, k:string)=> {fields!.set(k, v)});
		} else {
			fields= constructor[fieldSymb]!.fields
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
		// Add resolver
		if(typeof target[propertyKey] === 'function')
			s._.resolver= target[propertyKey];
		// Save
		fields.set(propertyKey, s);
	}
}

/** Required filed */
export function requiredField(schema: FieldArgSchema, comment?: string): Function;
export function requiredField(schema: FieldArgSchema, modifier: FieldSchema, comment?: string): Function;
export function requiredField(schema: FieldArgSchema, modifier?: FieldSchema|string, comment?: string){
	schema= new FieldSchema().type(schema);
	schema.required;
	if(modifier instanceof FieldSchema) schema.type(modifier);
	else if(typeof modifier=== 'string') comment= modifier;
	return field(schema, comment);
}

/** Argument */
export function arg(schema: FieldResolverArgSchema, comment?: string){
	return function(target: any, propertyKey: string, parameterIndex: number){
		if(parameterIndex!= 1)
			throw new Error(`@arg expected to be used on second argument only! used at arg: ${propertyKey}`);
		//Apply descriptor
		field(new FieldSchema({args: new FieldSchema({name:propertyKey, comment, resolver: target[propertyKey]}).type(schema)}))(target, propertyKey);
	}
}

/** Merge multiple entities */
export function merge(name: string, ...args: FieldMergeArg[]): ClassType{
	if(args.length<2)
		throw new Error('Merge: Expected at least 2 args');
	// Merge
	var fields:Map<string, FieldSchema> = new Map();
	var i, len, arg;
	for(i=0, len=args.length; i<len; ++i){
		arg= args[i];
		if(typeof arg === 'function'){
			var mp= (arg as ClassType)[fieldSymb];
			if(mp==null)
				throw new Error(`Missing fields on class ${arg.name}`);
			mp.fields.forEach((v, k)=>{
				fields.set(k, v);
			});
		} else if(arg instanceof Map){
			arg.forEach((v, k)=>{
				fields.set(k, v);
			});
		} else {
			var k;
			for(k in arg) fields.set(k, arg[k]);
		}
	}
	return class Filter{
		[fieldSymb]= {
			name,
			comment: undefined,
			fields
		}
	};
}