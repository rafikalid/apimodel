/** Generate fields */
export function field(type: Function|RegExp, schema?: FieldSchema | string){
	return function<T>(target: T, propertyKey: string, descriptor?: PropertyDescriptor){
		//TODO
	}
}

/** Field schema */
export class FieldSchema{
	//* Flags
	private _required= true
	private _read= true
	private _write= true
	
	//* Comment
	private _comment?:string
	
	//* Validation
	private _max?: number
	private _maxErr?: string
	
	private _min?: number
	private _minErr?: string
	
	private _lt?: number
	private _ltErr?: string
	
	private _gt?: number
	private _gtErr?: string
	
	private _regex?: RegExp

	//* GETTERS

	// Set field optional or required
	get required(){ this._required= true; return this }
	get optional(){ this._required= false; return this; }

	// Set field as readOnly
	get readOnly(){ this._write= false; this._read= true; return this; }
	get writeOnly(){ this._write= true; this._read= false; return this; }
	get readWrite(){ this._write= true; this._read= true; return this; }

	
	/** Add a comment to the field */
	comment(comment: string){
		this._comment= comment;
		return this;
	}

	/** Number, String.length or Array.length max value */
	max(max: number|undefined, errMsg?: string){
		this._max= max;
		this._maxErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length min value */
	min(min: number|undefined, errMsg?: string){
		this._min= min;
		this._minErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length max value */
	lte(max: number|undefined, errMsg?: string){
		this._max= max;
		this._maxErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length min value */
	gte(min: number|undefined, errMsg?: string){
		this._min= min;
		this._minErr= errMsg;
		return this;
	}
	/** Number, String.length or Array.length Less than */
	lt(value: number|undefined, errMsg?: string){
		this._lt= value;
		this._ltErr= errMsg;
		return this
	}
	/** Number, String.length or Array.length Greater than */
	gt(value: number|undefined, errMsg?: string){
		this._gt= value;
		this._gtErr= errMsg;
		return this
	}

	/** Apply a regex */
	regex(regex: RegExp){
		this._regex= regex;
		return this;
	}
}


/** Export predefined elements */
export const fieldArg= new Proxy({}, {
	get(_, k: keyof FieldSchema): FieldSchema{
		return (new FieldSchema())[k] as FieldSchema
	}
}) as FieldSchema;