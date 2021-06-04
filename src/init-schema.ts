import { DocSymb } from "./symbols";
import type {ClassFields, SchemaType} from './graphql-wr'
import {makeGraphQLSchema} from './graphql-wr'

/**
 * To avoid circular dependancy and Temporary Dead Zones
 * init schema first
 */
export function initSchema(){
	/** Map classes */
	const _map: Map<string, ClassFields>= new Map();

	/** Create doc */
	function doc(ref?: string, comment?: string){
		// Apply
		return function(constructor: ClassFields){
			constructor[DocSymb]= comment;
			var name= ref ?? constructor.name;
			if(_map.has(name))
				throw new Error(`Doc already defined: ${ref}`);
			_map.set(name, constructor);
		}
	}

	/** Create schema */
	function compile(args: SchemaType[]){
		return makeGraphQLSchema(args, _map);
	}

	/** Interface */
	return {doc, compile};
}