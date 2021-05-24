import { GraphQLEnumType, GraphQLScalarType } from "graphql";
import { fieldSymb } from "symbols";

/**
 * Generate fields
 * @param {Function|RegExp|Record<string, string|number>} type - Type or Regex of Enum
 */
export function field(type: FieldDescType|RegExp, schema?: FieldSchema | string){
	/** Init type */
	if(!(schema instanceof FieldSchema))
		schema= new FieldSchema({comment: schema})
	if(type instanceof RegExp)
		schema.type(String).regex(type);
	else
		schema.type(type);
	/** Apply */
	return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor){
		type constType= {[fieldSymb]?: Map<string, FieldArgSchema>};
		var constructor=  (typeof target === 'function'? target : target.constructor) as constType;
		var parentConstructor= Reflect.getPrototypeOf(constructor) as constType;
		var fields= constructor[fieldSymb] || (constructor[fieldSymb]= new Map<string, FieldArgSchema>())
		var parentFields= parentConstructor[fieldSymb]
		fields.set(propertyKey, (schema as FieldSchema).build(fields.get(propertyKey), parentFields?.get(propertyKey)))
	}
}

/** Args schema */
type FieldDescType= Function|GraphQLScalarType|GraphQLEnumType
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
	regexErr:	undefined
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
	comment(comment: string){
		this._.comment= comment;
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

	/** Apply a regex */
	regex(regex: RegExp, errMsg?: string){
		this._.regex= regex;
		this._.regexErr= errMsg;
		return this;
	}

	/** Build */
	build(currentField:FieldArgSchema|undefined, parentField: FieldArgSchema|undefined){
		if(currentField)
			Object.assign(currentField, this._)
		else
			currentField= Object.assign({}, parentField, this._);
		return currentField;
	}
}

/** Export methods */
export function comment(comment: string){ return new FieldSchema({comment})}
export function max(max: number, errMsg?: string){ return new FieldSchema({max, maxErr: errMsg})}
export function min(min: number, errMsg: string){return new FieldSchema({min, minErr: errMsg})}
export function lte(max: number, errMsg: string){return new FieldSchema({max, maxErr: errMsg})}
export function gte(min: number, errMsg: string){return new FieldSchema({min, minErr: errMsg})}
export function lt(lt: number, errMsg: string){return new FieldSchema({lt, ltErr: errMsg})}
export function gt(gt: number, errMsg: string){return new FieldSchema({gt, gtErr: errMsg})}
export function regex(regex: RegExp, errMsg: string){return new FieldSchema({regex, regexErr: errMsg})}
export function deprecated(reason: string){ return new FieldSchema({deprecated: reason})}

/** Create conts */
function _fieldArgConst(options: FieldArgSchema){
	return new Proxy(new FieldSchema(options), {
		get(obj, k:keyof FieldSchema){
			return obj[k]
		}
	})
}

export const required=	_fieldArgConst({required: true});
export const optional=	_fieldArgConst({required: false});
export const readOnly=	_fieldArgConst({read: true, write: false});
export const writeOnly=	_fieldArgConst({read:false, write: true});
export const readWrite=	_fieldArgConst({read: true, write: true});


// export const Timestamp= _fieldArgConst({type: Number})