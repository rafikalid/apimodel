import { ClassType } from "./schema";
import {fieldSymb} from './symbols';

type UnionResolver= (value:any)=> number;
/** Create unions */
export class Union{
	_name: string;
	_types: Function[];
	_resolver: UnionResolver;
	_description: string;

	constructor(name: string, desc: string, types: Function[], resolver: UnionResolver){
		// Check types
		if(!Array.isArray(types) || types.length < 2)
			throw new Error('Expected at least 2 types for this union!');
		var i, len, tp;
		for(i=0, len= types.length; i<len; ++i){
			tp= types[i];
			if(!(
				typeof tp === 'string'
				|| (typeof tp === 'function' && (tp as ClassType)[fieldSymb] != null)
				// || tp instanceof Map
				|| (typeof tp === 'object' && tp!= null)
			))
				throw new Error(`Illegal type for union [${name}] at index: ${i}`);
		}
		// save
		this._name= name;
		this._description= desc;
		this._types= types;
		this._resolver= resolver;
	}
}


// /** UNION */
// union(
// 	/** Name for the union */
// 	name: string,
// 	/** Types nested in this union */
// 	types: any[],
// 	/** Resolver returns the index of target type */
// 	typeResolver: UnionResolver
// ){
// 	var _= this._;
// 	_.name= name;
// 	_.input= false;
// 	_.output= true; // unions are output only
// 	(_ as FieldUnionDescriptor).resolver= typeResolver;
// 	//Types
// 	var arrtypes: FieldRefDescriptor[]= [];
// 	var i, tp, obj, len= types.length;
// 	for(i=0; i<len; ++i){
// 		tp= types[i];
// 		obj= tp instanceof FieldSchema? tp._ : new FieldSchema().type(tp)._;
// 		if(obj.type !== FieldTypes.REF)
// 			throw new Error(`Expected unions as Objects, received arg [${i}] as ${typeof obj.type==='undefined' ? 'undefined' : FieldTypes[obj.type]}`);
// 		arrtypes.push(obj as FieldRefDescriptor);
// 	}
// 	(_ as FieldUnionDescriptor).types= arrtypes;
// 	return this;
// }