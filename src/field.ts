import { FieldMergeArg, FieldResolverArgSchema, FieldSchema } from "./schema";
import type { FieldArgSchema, ClassType, EntityDescriptor } from "./schema";
import { fieldSymb } from "./symbols";

/** Generate field schema */
//string | GraphQLScalarType | GraphQLEnumType | Function | FieldSchema | RegExp | Union | Record<string, FieldSchema> | Map<string, FieldSchema> | FieldArgSchema[]
export function field(schema: FieldArgSchema, commentOrModifier?: string|FieldSchema, commentOrModifier2?: string|FieldSchema){
	// return fx
	return function(target: any, propertyKey: string){
		// Create class descriptor
		var constructor=  (typeof target === 'function'? target : target.constructor) as ClassType;
		if(!constructor.hasOwnProperty(fieldSymb))
			doc()(constructor);
		var fields:Map<string, FieldSchema>= constructor[fieldSymb]!.fields;
		// Create field descriptor
		var prevSkm= fields.get(propertyKey);
		var s= prevSkm==null ? new FieldSchema({name: propertyKey}) : new FieldSchema().type(prevSkm);
		s.type(schema); // apply new schema
		// Modifier 1
		if(typeof commentOrModifier === 'string')
			s.comment(commentOrModifier);
		else if(commentOrModifier instanceof FieldSchema)
			s.type(commentOrModifier);
		// Modifier 2
		if(typeof commentOrModifier2 === 'string')
			s.comment(commentOrModifier2);
		else if(commentOrModifier2 instanceof FieldSchema)
			s.type(commentOrModifier2);
		// Add resolver
		if(typeof target[propertyKey] === 'function'){
			s._.resolver= target[propertyKey];
			s._.input= false;
		}
		// Save
		fields.set(propertyKey, s);
	}
}

/** Required filed */
export function requiredField(schema: FieldArgSchema, modifier?: FieldSchema|string, modifier2?: FieldSchema|string){
	schema= new FieldSchema().type(schema);
	schema.required;
	return field(schema, modifier, modifier2);
}

/** Argument */
export function arg(schema: FieldResolverArgSchema, comment?: string){
	return function(target: any, propertyKey: string, parameterIndex: number){
		if(parameterIndex!= 1)
			throw new Error(`@arg expected to be used on second argument only! used at arg: ${propertyKey}`);
		//Apply descriptor
		field(new FieldSchema({args: new FieldSchema({name:`${propertyKey}Arg`, comment, resolver: target[propertyKey], input: false}).type(schema)}))(target, propertyKey);
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

/** Add entity meta data */
export function doc(comment?: string){
	return function(constructor: ClassType){
		if(constructor.hasOwnProperty(fieldSymb)){
			constructor[fieldSymb]!.comment= comment;
		} else {
			var fields = new Map();
			var parentFields= constructor[fieldSymb];
			if(parentFields){
				parentFields.fields.forEach((v:FieldSchema, k:string)=> {fields!.set(k, v)});
				if(!comment) comment= parentFields.comment;
			}
			// Save
			constructor[fieldSymb]= {
				name:		constructor.name,
				comment:	comment,
				fields:		fields
			};
		}
	}
}