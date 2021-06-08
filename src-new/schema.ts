import { fieldSymb } from "./symbols";

/** Class type */
export interface ClassType extends Function{
	[fieldSymb]?: Map<string, FieldSchema>
};
/** Field types */
export enum FieldTypes{
	LIST,
	UNION,
	REF // reference or object
}

export type FieldArgSchema= string | Function | FieldSchema | RegExp | Record<string, FieldSchema> | Map<string, FieldSchema> | FieldArgSchema[]

/** Generate schema info */
export interface FieldDescriptor{
	/** Field name */
	name:		string|undefined
	/** Type */
	type:		FieldTypes|undefined
	/** If value of this field is required */
	required:	Boolean
	/** Read value */
	input:		Boolean
	output:		Boolean
	/** Comment */
	comment?:	string
	/** Message if this is deprecated */
	deprecated?: string
	/** Default value, used for arguments */
	default?:	any
	
	//* Assertions
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
	assertInErr?: string
	/** Method arguments: case of method */
	args?:	FieldSchema
}

/** Reference field descriptor */
export interface FieldRefDescriptor extends FieldDescriptor{
	type: FieldTypes.REF
	// Soft or hard reference (Using name as string or reference the obejct)
	ref:	any
}
/** List field descriptor */
export interface FieldListDescriptor extends FieldDescriptor{
	type: FieldTypes.LIST
	// items data
	items:	FieldDescriptor
}
/** Scalar field descriptor */
export interface FieldUnionDescriptor extends FieldDescriptor{
	type:		FieldTypes.UNION
	types:		FieldRefDescriptor[]
	resolver:	UnionResolver
}

/** Field method */
export interface FieldMethodDescriptor{
	/** Method declaration */
	method: Function
	/** Arguments, for GraphQL, only args[1] will be set */
	args: (FieldDescriptor|undefined)[]
	/** Return value */
	return: FieldDescriptor
}

/** Default values for schema fields */
const FIELD_DEFAULTS: FieldDescriptor= {
	name:		undefined,
	/** Type */
	type:		undefined,
	/** If value of this field is required */
	required:	false,
	/** Read value */
	input:		true,
	output:		true,
	/** Comment */
	comment:	undefined,
	/** Message if this is deprecated */
	deprecated: undefined,
	/** Default value, used for arguments */
	default:	undefined,
	
	//* Assertions
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
	/** Asserts */
	assertIn:	undefined,
	assertInErr: undefined,
	/** args */
	args: undefined
}

/** Union resolver format */
type UnionResolver= (value:any)=> number;

/** Field schema */
export class FieldSchema{
	private _: FieldDescriptor;
	constructor(options?: Partial<FieldDescriptor>){
		this._= Object.assign({}, FIELD_DEFAULTS, options);
	}
	//* GETTERS

	// Set field optional or required
	get required(){ this._.required= true; return this }
	get optional(){ this._.required= false; return this; }
	get notNull(){ this._.required= true; return this; }
	get null(){ this._.required= false; return this; }

	// Set field as readOnly
	get inOnly(){ this._.input= true; this._.output= false; return this; }
	get outOnly(){ this._.input= false; this._.output= true; return this; }
	get inOut(){ this._.input= true; this._.output= true; return this; }

	/** Set the type of the field */
	type(type: FieldArgSchema){
		var _= this._
		if(Array.isArray(type)){
			if(type.length !== 1)
				throw new Error(`List as type expects exactly one entry as type`);
			this.rList(type[0]);
		} else if(type instanceof FieldSchema){
			var ref= type._;
			var k: keyof FieldDescriptor;
			for(k in ref)
				if(ref.hasOwnProperty(k) && typeof ref[k] !== 'undefined') _[k]= ref[k];
		}else if(type instanceof RegExp){
			_.regex= type;
			_.type= FieldTypes.REF;
			(_ as FieldRefDescriptor).ref= String;
		} else {
			_.type= FieldTypes.REF;
			(_ as FieldRefDescriptor).ref= type;
		}
		return this;
	}
	/** required list with required items, equivalent to [!]! */
	rList(type: FieldArgSchema){
		var _= this._
		_.type= FieldTypes.LIST
		_.required= true
		if(!(type instanceof FieldSchema))
			type= new FieldSchema({required: true}).type(type);
		(_ as Partial<FieldListDescriptor>).items= type._;
		return this;
	}
	/** List */
	list(type:FieldArgSchema){
		var _= this._
		_.type= FieldTypes.LIST
		if(!(type instanceof FieldSchema)) type= new FieldSchema().type(type);
		(_ as FieldListDescriptor).items= type._;
		return this;
	}

	/** UNION */
	union(
		/** Name for the union */
		name: string,
		/** Types nested in this union */
		types: any[],
		/** Resolver returns the index of target type */
		typeResolver: UnionResolver
	){
		var _= this._;
		_.name= name;
		_.input= false;
		_.output= true; // unions are output only
		(_ as FieldUnionDescriptor).resolver= typeResolver;
		//Types
		var arrtypes: FieldRefDescriptor[]= [];
		var i, tp, obj, len= types.length;
		for(i=0; i<len; ++i){
			tp= types[i];
			obj= tp instanceof FieldSchema? tp._ : new FieldSchema().type(tp)._;
			if(obj.type !== FieldTypes.REF)
				throw new Error(`Expected unions as Objects, received arg [${i}] as ${typeof obj.type==='undefined' ? 'undefined' : FieldTypes[obj.type]}`);
			arrtypes.push(obj as FieldRefDescriptor);
		}
		(_ as FieldUnionDescriptor).types= arrtypes;
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
		this._.deprecated= reason ?? '<deprecated>';
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
	// build(currentField?:FieldArgSchema, parentField?: FieldArgSchema){
	// 	if(currentField)
	// 		_mergeObj(currentField, this._)
	// 	else
	// 		currentField= _mergeObj({}, parentField, this._);
	// 	return currentField!;
	// }
}

/** Export methods */
export function type(type: any){ return new FieldSchema().type(type) }
export function list(type: any){ return new FieldSchema().list(type); }
export function rList(type: any){ return new FieldSchema().rList(type); }
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
function _fieldArgConst(options: Partial<FieldDescriptor>){
	return new Proxy(new FieldSchema(options), {
		get(obj, k:keyof FieldSchema){
			return obj[k]
		}
	})
}

export const required=	_fieldArgConst({required: true});
export const notNull=	required;
export const optional=	_fieldArgConst({required: false});
export const inOnly=	_fieldArgConst({input: true, output: false});
export const outOnly=	_fieldArgConst({input: false, output: true});
export const inOut=	_fieldArgConst({input: true, output: true});
