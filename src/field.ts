import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLScalarType, GraphQLString } from "graphql";
import { Union } from "./graphql-wr";
import { fieldSymb } from "./symbols";

/** Class type */
interface classType extends Function{
	[fieldSymb]?: Map<string, FieldArgSchema>
};

/** @private build schema */
function _getBuiltSchema(target: any, schema: FieldSchema, propertyKey: string){
	var constructor=  (typeof target === 'function'? target : target.constructor) as classType;
	var parentConstructor= Reflect.getPrototypeOf(constructor) as classType;
	var fields= constructor[fieldSymb] || (constructor[fieldSymb]= new Map<string, FieldArgSchema>())
	var parentFields= parentConstructor[fieldSymb]
	var builtSchema=  (schema as FieldSchema).build(fields.get(propertyKey), parentFields?.get(propertyKey));
	//Add resolver
	if(typeof target[propertyKey] === 'function')
		builtSchema.resolve= target[propertyKey];
	//set
	fields.set(propertyKey, builtSchema);
	return builtSchema;
}

/** @private create schema */
function _createSchema(type: any, schema?: any){
	/** Init type */
	if(type instanceof FieldSchema){
		if(typeof schema === 'string')
			type.comment(schema);
		else if(schema!=null) throw new Error('Illegal argument');
			schema= type;
	} else {
		if(!(schema instanceof FieldSchema))
			schema= new FieldSchema({comment: schema})
	
		if(type instanceof RegExp)
			schema.type(String).regex(type);
		else
			schema.type(type);
	}
	return schema;
}

/**
 * Generate fields
 * @param {Function|RegExp|Record<string, string|number>} type - Type or Regex of Enum
 */
function field(schema: FieldSchema, comment?: string): Function;
function field(type: FieldDescType|RegExp, schema?: FieldSchema | string): Function;
function field(type: FieldDescType|RegExp, schema: FieldSchema, comment: string): Function;
function field(type: any, schema?: any, comment?: string){
	/** Init type */
	schema= _createSchema(type, schema);
	if(typeof comment === 'string')
		schema.comment(comment);
	/** Apply */
	return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor){
		_getBuiltSchema(target, schema as FieldSchema, propertyKey);
	}
}
/** Required filed */
function requiredField(schema: FieldSchema, comment?: string): Function;
function requiredField(type: FieldDescType|RegExp, schema?: FieldSchema | string): Function;
function requiredField(type: FieldDescType|RegExp, schema?: FieldSchema, comment?: string): Function;
function requiredField(type: any, schema?: any, comment?: string){
	/** Init type */
	schema= _createSchema(type, schema);
	schema.required
	if(typeof comment === 'string')
		schema.comment(comment);
	/** Apply */
	return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor){
		_getBuiltSchema(target, schema as FieldSchema, propertyKey);
	}
}

export {field, requiredField};

/** Argument */
export function arg(docType: classType|Record<string, any>, comment?: string){
	if(typeof docType=== 'function' && !(docType as classType)[fieldSymb]) throw new Error(`Expected valid class with fields: ${docType}`);
	var schema= new FieldSchema({arg: docType, comment});
	return function(target: any, propertyKey: string, parameterIndex: number){
		if(parameterIndex!= 1) throw new Error(`Could use @arg on second argument only! at: ${propertyKey}`);
		var buildSchema= _getBuiltSchema(target, schema as FieldSchema, propertyKey);
		buildSchema.arg= docType;
	}
}

/** Args schema */
export type FieldDescType= Function | GraphQLScalarType | GraphQLEnumType | Record<string, FieldSchema> | Map<string, FieldArgSchema> | Union | FieldDescType[] | FieldSchema[]
export interface FieldArgSchema{
	type?:		FieldDescType, // Field type or Enumeration (exp: String, ...)
	//* Flags
	required?:	Boolean
	read?:		Boolean
	write?:		Boolean
	//* Comment
	comment?:	string
	//* Deprecate field
	deprecated?: string,
	//* Validation
	max?:		number
	maxErr?:	string
	min?:		number
	minErr?:	string
	lt?:		number
	ltErr?:		string
	gt?:		number
	gtErr?:		string
	regex?:		RegExp
	regexErr?:	string
	length?:	number
	lengthErr?:	string
	/** Asserts */
	assertIn?:	Set<any>,
	assertInErr?: string,
	/** Resolver */
	resolve?:	Function
	/** Arguments when method */
	arg?:		classType|Record<string, any>
	/** Default value, used for arguments */
	default?:	any
}

const FIELD_DEFAULTS: FieldArgSchema= {
	type:		undefined, // Field type (exp: String, ...)
	//* Flags
	required:	false,
	read:		true,
	write:		true,
	//* Comment
	comment:	undefined,
	//* Deprecate field
	deprecated: undefined,
	//* Validation
	max:		undefined,
	maxErr:		undefined,
	min:		undefined,
	minErr:		undefined,
	lt:			undefined,
	ltErr:		undefined,
	gt:			undefined,
	gtErr:		undefined,
	regex:		undefined,
	regexErr:	undefined,
	length:		undefined,
	lengthErr:	undefined,
	resolve:	undefined,
	/** Asserts */
	assertIn:	undefined,
	assertInErr: undefined,
	/** Args when method */
	arg:		undefined,
	/** Default value */
	default:	undefined
}

/** Field schema */
export class FieldSchema{
	private _: FieldArgSchema;
	constructor(options?: FieldArgSchema){
		this._= Object.assign({}, FIELD_DEFAULTS, options);
	}
	//* GETTERS

	// Set field optional or required
	get required(){ this._.required= true; return this }
	get optional(){ this._.required= false; return this; }
	get notNull(){ this._.required= true; return this; }
	get null(){ this._.required= false; return this; }

	// Set field as readOnly
	get readOnly(){ this._.write= false; this._.read= true; return this; }
	get writeOnly(){ this._.write= true; this._.read= false; return this; }
	get readWrite(){ this._.write= true; this._.read= true; return this; }

	/** Set the type of the field */
	type(type: FieldDescType){
		this._.type= type;
		return this;
	}
	
	/** Add a comment to the field */
	comment(comment?: string){
		this._.comment= comment;
		return this;
	}

	/** Set default value */
	default(value: any){
		this._.default= value;
		return this;
	}

	/** Deprecate field */
	deprecated(reason: string){
		this._.deprecated= reason;
		return this;
	}

	/** Number, String.length or Array.length max value */
	max(max: number|undefined, errMsg?: string){
		this._.max= max;
		this._.maxErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length min value */
	min(min: number|undefined, errMsg?: string){
		this._.min= min;
		this._.minErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length max value */
	lte(max: number|undefined, errMsg?: string){
		this._.max= max;
		this._.maxErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length min value */
	gte(min: number|undefined, errMsg?: string){
		this._.min= min;
		this._.minErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length Less than */
	lt(value: number|undefined, errMsg?: string){
		this._.lt= value;
		this._.ltErr= errMsg;
		return this
	}
	/** Number, String.length or Array.length Greater than */
	gt(value: number|undefined, errMsg?: string){
		this._.gt= value;
		this._.gtErr= errMsg;
		return this
	}
	/** Value between */
	between(min: number, max: number, errMsg?: string){
		var _= this._
		_.min= min;
		_.max= max;
		_.minErr= _.maxErr= errMsg;
		return this;
	}
	/** string.length or Array.length has exaclty a size */
	length(value: number, errMsg?: string): this
	length(min: number, max: number, errMsg?: string): this
	length(a: any, b?: any, c?:any){
		var _= this._
		if(typeof b === 'number'){
			_.min= a;
			_.max= b;
			_.minErr= _.maxErr= c;
		} else {
			if(!Number.isSafeInteger(a)) throw new Error(`Illegal length: ${a}`);
			_.length= a;
			_.lengthErr= b;
		}
		return this;
	}

	/** Apply a regex */
	regex(regex: RegExp, errMsg?: string){
		this._.regex= regex;
		this._.regexErr= errMsg;
		return this;
	}
	/** Assert value in an array */
	assertIn<T>(arr: Set<T>, errMsg?: string){
		this._.assertIn= arr;
		this._.assertInErr= errMsg;
	}

	/** Build */
	build(currentField?:FieldArgSchema, parentField?: FieldArgSchema){
		if(currentField)
			_mergeObj(currentField, this._)
		else
			currentField= _mergeObj({}, parentField, this._);
		return currentField!;
	}
}

function _mergeObj(target: any, a?: any, b?: any){
	var k;
	if(a){ for(k in a) if(a[k]!=null) target[k]= a[k];}
	if(b){ for(k in b) if(b[k]!=null) target[k]= b[k];}
	return target;
}

/** Export methods */
export function type(type: FieldDescType){ return new FieldSchema({type}) }
export function list(type: FieldDescType){ return new FieldSchema({type: [new FieldSchema({type, required: true})]}); }
export function nullableList(type: FieldDescType){ return new FieldSchema({type: [type]}); }
export function comment(comment?: string){ return new FieldSchema({comment})}
export function max(max: number, errMsg?: string){ return new FieldSchema({max, maxErr: errMsg})}
export function min(min: number, errMsg?: string){return new FieldSchema({min, minErr: errMsg})}
export function between(min: number, max: number, errMsg?: string){return new FieldSchema().between(min, max, errMsg)}
export function lte(max: number, errMsg?: string){return new FieldSchema({max, maxErr: errMsg})}
export function gte(min: number, errMsg?: string){return new FieldSchema({min, minErr: errMsg})}
export function lt(lt: number, errMsg?: string){return new FieldSchema({lt, ltErr: errMsg})}
export function gt(gt: number, errMsg?: string){return new FieldSchema({gt, gtErr: errMsg})}
export function assertIn<T>(arr: Set<T>, errMsg?: string){return new FieldSchema({assertIn: arr, assertInErr: errMsg})}
export function regex(regex: RegExp, errMsg?: string){return new FieldSchema({regex, regexErr: errMsg})}
export function deprecated(reason: string){ return new FieldSchema({deprecated: reason})}


export function length(value: number, errMsg?: string): FieldSchema
export function length(min: number, max: number, errMsg?: string): FieldSchema
export function length(a: number, b?: any, c?: any){
	if(arguments.length === 3)
		return new FieldSchema().length(a, b, c);
	else
		return new FieldSchema().length(a, b);
}
/** Create conts */
function _fieldArgConst(options: FieldArgSchema){
	return new Proxy(new FieldSchema(options), {
		get(obj, k:keyof FieldSchema){
			return obj[k]
		}
	})
}

export const required=	_fieldArgConst({required: true});
export const notNull=	required;
export const optional=	_fieldArgConst({required: false});
export const readOnly=	_fieldArgConst({read: true, write: false});
export const writeOnly=	_fieldArgConst({read:false, write: true});
export const readWrite=	_fieldArgConst({read: true, write: true});


// Extends descriptor
export function override(clazz: FieldDescType, extend: Record<string, FieldSchema>){
	// prepare Map
	var argDescriptor: Map<string, FieldArgSchema>;
	if(typeof clazz === 'function'){
		argDescriptor= (clazz as classType)[fieldSymb] ?? new Map();
	} else if(clazz instanceof Map){
		argDescriptor= clazz
	} else {
		argDescriptor= new Map();
		var k: string;
		for(k in (clazz as Record<string, FieldSchema>))
			if(clazz.hasOwnProperty(k)){
				//@ts-expect-error
				argDescriptor.set(k, clazz[k].build())
			}
	}
	// override keys
	for(k in extend) if(extend.hasOwnProperty(k)){
		argDescriptor.set(k, extend[k].build());
	}
	return argDescriptor;
}
