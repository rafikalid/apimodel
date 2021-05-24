import { FieldArgSchema } from 'field';
import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLObjectType, GraphQLScalarType, GraphQLSchema, GraphQLString } from 'graphql';
import {fieldSymb} from './symbols';
/** Schema basic data */
type ClassFields= {[fieldSymb]: Map<string, FieldArgSchema>, name: string};
type SchemaType= {Query?: ClassFields, Mutation?: ClassFields}


/** Generating graphql schema */
export function makeGraphQLSchema(... args: SchemaType[]){
	//* Prepare Queries and mutations
	var q= [];
	var i, len, arg;
	for(i=0, len= args.length; i<len; i++){
		arg= args[i];
		if(arg.Query) q.push('type', arg.Query);
		if(arg.Mutation) q.push('type', arg.Mutation);
	}
	if(q.length===0) throw new Error('No Query or Mutation found!');

	// Go through queue
	/** Map types to classes */
	type objectTypeRecord= Record<string, any>
	const mapClasses= new Map<string, objectTypeRecord>();
	const mapClassesDef= new Map<string, GraphQLObjectType>();
	// Map Query
	var mQuery= {};
	mapClasses.set('type Query', mQuery);
	mapClassesDef.set('type Query', new GraphQLObjectType({
		name: 'RootQueryType',
		fields: mQuery
	}));
	//Map Mutation
	var mMutation= {}
	mapClasses.set('type Mutation', mMutation);
	mapClassesDef.set('type Mutation', new GraphQLObjectType({
		name: 'RootMutationType',
		fields: mMutation
	}));

	/** Mark classes as visited */
	const visitedClasses= new Set<ClassFields>();
	i=0, len=1;
	while(i<len){
		var keyword= q[i++] as 'string'; // "type" or "input"
		var cl= q[i++] as ClassFields; // get current class
		//* Ignore visited classes
		if(visitedClasses.has(cl)) continue
		visitedClasses.add(cl);
		//* Get field descriptor
		var key= `${keyword} ${cl.name}`;
		var fieldDescriptor= mapClasses.get(key)
		if(!fieldDescriptor) throw new Error(`Exprected field descriptor for: ${key}`);
		//if(!fieldDescriptor) mapClasses.set(key, fieldDescriptor= {});
		//* Get fields
		var fields= cl[fieldSymb];
		if(!fields) throw new Error(`Expected fields on class: ${cl.name}`);
		//* Add fields
		var fieldIt= fields.entries()
		var entry= fieldIt.next()
		while(!entry.done){
			var [fieldKey, fieldValue]= entry.value;
			if(Reflect.has(fieldDescriptor, fieldKey))
				throw new Error(`Duplicate entry: ${key}::${fieldKey}`);
			// add
			var fieldType= fieldValue.type!
			var fieldDesc: any
			//* Scalar or enum
			if(fieldType instanceof GraphQLScalarType || fieldType instanceof GraphQLEnumType){
				// Nothing to do
			}
			//* Doc input
			else if((fieldType as any as ClassFields)[fieldSymb]){
				// TODO
			}
			else if(fieldType === Number)
				fieldType= GraphQLFloat;
			else if(fieldType === String)
				fieldType= GraphQLString
			else if(fieldType === Boolean)
				fieldType= GraphQLBoolean
			else
				throw new Error(`Illegal type for ${key}::${fieldKey}>> ${fieldType}`);
			// Next
			var entry= fieldIt.next()
		}
	}
	//* Return schema
	return new GraphQLSchema({
		query:	mapClassesDef.get('type Query'),
		mutation: mapClassesDef.get('type Mutation')
	});
}


/** Create GraphQL enum */
export function toGraphQlEnum(name: string, description: string, enumObj: Record<string, string|number>){
	var values: Record<string, {value: string|number}>= {}, k;
	for(k in enumObj)
		values[k]= {value: enumObj[k]};
	return new GraphQLEnumType({
		name,
		values: values,
		description
	});
}