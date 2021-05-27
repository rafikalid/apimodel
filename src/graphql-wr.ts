import { GraphQLBoolean, GraphQLEnumType, GraphQLFieldConfigArgumentMap, GraphQLFloat, GraphQLInputObjectType, GraphQLInputType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLOutputType, GraphQLScalarType, GraphQLSchema, GraphQLSchemaConfig, GraphQLString } from 'graphql';
import { field, FieldArgSchema, FieldDescType, FieldSchema } from './field';
import {DocSymb, fieldSymb} from './symbols';
import { _iteratorFromObj } from './utils';

/** Basic types */
export const Int= GraphQLInt
export const Float= GraphQLFloat

/** Schema basic data */
interface ClassFields extends Function {
	[fieldSymb]: Map<string, FieldArgSchema>,
	[DocSymb]?: string
}
type gqlDocType= ClassFields|Record<string, FieldDescType>;
type SchemaType= {
	Query?: Function|Record<string, FieldDescType>,
	Mutation?: Function|Record<string, FieldDescType>
}

/**
 * Graphql object type:
 * ! Reformat the code when adding new entries
 */
enum graphQlObject{
	TYPE,
	INPUT
}

/** Map classes to it's definition */
interface mapClassInterface{
	typeFields?:	Record<string, any>, // map gqlType fields
	gqlType?:	GraphQLObjectType, // Mapped object
	inputFields?: Record<string, any>, // map gqlType fields
	gqlInput?:	GraphQLInputObjectType // Mapped input
}

/**  */
/** Create descriptor fields */
function TYPE_QUERY(){}; // map only query
function TYPE_MUTATION(){}; // Enable to map queries
enum WrappedQueueWrappers{LIST, NON_NULL};
function _parseGraphQlType(field: FieldArgSchema, fieldName: string, _getDescriptor: (doc:gqlDocType)=>mapClassInterface, typeOrInput: graphQlObject){
	// Field type
	var fieldType;
	//* Extract field from list and Non nulls
	var WrappedQueue= []; // wrapped with list or nonNull
	if(field.required)
		WrappedQueue.push(WrappedQueueWrappers.NON_NULL);
	fieldType= field.type!
	while(Array.isArray(fieldType)){
		if(fieldType.length !== 1)
			throw 'Lists in schema expected exactly to have one item!';
		WrappedQueue.push(WrappedQueueWrappers.LIST);
		fieldType= fieldType[0];
		if(fieldType instanceof FieldSchema){
			field= fieldType.build();
			fieldType= field.type!;
			if(field.required)
				WrappedQueue.push(WrappedQueueWrappers.NON_NULL);
		}
	}
	//* Basic data
	var targetFieldGql: GraphQLOutputType | GraphQLInputType;
	var isNew= false;
	if(fieldType === Number)
		targetFieldGql= GraphQLFloat;
	else if(fieldType === String)
		targetFieldGql= GraphQLString
	else if(fieldType === Boolean)
		targetFieldGql= GraphQLBoolean
	//* Scalar or enum
	else if(fieldType instanceof GraphQLScalarType || fieldType instanceof GraphQLEnumType)
		targetFieldGql= fieldType;
	//* Doc input
	else{
		var descriptor= _getDescriptor(fieldType as gqlDocType);
		var nextDescriptorFields;
		// Field name
		if(typeof fieldType === 'function')
			fieldName= fieldType.name;
		// next object fields
		if(typeOrInput===graphQlObject.TYPE){
			nextDescriptorFields= descriptor.typeFields
			if(!nextDescriptorFields){
				isNew= true;
				nextDescriptorFields= {};
				descriptor.typeFields= nextDescriptorFields;
				descriptor.gqlType= new GraphQLObjectType({
					name: fieldName,
					fields: nextDescriptorFields,
					description: (fieldType as ClassFields)[DocSymb]
				});
			}
			targetFieldGql= descriptor.gqlType!;
		} else {
			nextDescriptorFields= descriptor.inputFields
			if(!nextDescriptorFields){
				isNew= true;
				nextDescriptorFields= {};
				descriptor.inputFields= nextDescriptorFields;
				descriptor.gqlInput= new GraphQLInputObjectType({
					name: `${fieldName}Input`,
					fields: nextDescriptorFields,
					description: (fieldType as ClassFields)[DocSymb]
				});
			}
			targetFieldGql= descriptor.gqlInput!
		}
	}
	// Wrap with list
	var i= WrappedQueue.length;
	while(--i>=0){
		switch(WrappedQueue[i]){
			case WrappedQueueWrappers.LIST:
				targetFieldGql= new GraphQLList(targetFieldGql);
				break
			case WrappedQueueWrappers.NON_NULL:
				targetFieldGql= new GraphQLNonNull(targetFieldGql);
				break
			default:
				throw new Error(`Illegal value for switch: ${WrappedQueue[i]}`);		
		}
	}
	// Return
	return {
		targetFieldGql: targetFieldGql,
		isNew: isNew,
		fieldType
	}
}

/** Generating graphql schema */
export function makeGraphQLSchema(... args: SchemaType[]){
	//* Prepare Queries and mutations
	var q= [], qObj= [];
	var i, len, arg;
	const rootQueries= new Set();
	const rootMutations= new Set();
	const resultSchema: GraphQLSchemaConfig= {};
	for(i=0, len= args.length; i<len; i++){
		arg= args[i];
		if(arg.Query) {
			q.push(graphQlObject.TYPE);
			qObj.push(arg.Query);
			rootQueries.add(arg.Query);
		}
		if(arg.Mutation) {
			q.push(graphQlObject.TYPE);
			qObj.push(arg.Mutation);
			rootMutations.add(arg.Mutation);
		}
	}
	if(q.length===0) throw new Error('No Query or Mutation found!');

	// Go through queue
	/** Map types to classes */
	const mapClasses: Map<any, mapClassInterface>= new Map();
	
	/** Add basic mappers */
	var mField, mSchema;
	if(rootQueries.size){
		mField= {};
		mSchema= new GraphQLObjectType({name: 'RootQueryType', fields: mField});
		mapClasses.set(TYPE_QUERY, {
			typeFields:	mField, // map gqlType fields
			gqlType:	 mSchema, // Mapped object
			inputFields: undefined, // map gqlType fields
			gqlInput:	undefined // Mapped input
		});
		resultSchema.query= mSchema;
	}
	if(rootMutations.size){
		mField= {};
		mSchema= new GraphQLObjectType({name: 'RootMutationType', fields: mField});
		mapClasses.set(TYPE_MUTATION, {
			typeFields:	mField, // map gqlType fields
			gqlType:	mSchema, // Mapped object
			inputFields: undefined, // map gqlType fields
			gqlInput:	undefined // Mapped input
		});
		resultSchema.mutation= mSchema;
	}
	//* Get descriptor
	function _getDescriptor(obj:gqlDocType){
		var mapperObj;
		if(rootQueries.has(obj)) mapperObj= TYPE_QUERY;
		else if(rootMutations.has(obj)) mapperObj= TYPE_MUTATION;
		else mapperObj= obj
		//* Get field descriptor
		var descriptor= mapClasses.get(mapperObj);
		if(!descriptor){
			descriptor= {
				typeFields:	undefined, // map gqlType fields
				gqlType:	undefined, // Mapped object
				inputFields: undefined, // map gqlType fields
				gqlInput:	undefined // Mapped input
			};
			mapClasses.set(mapperObj, descriptor);
		}
		return descriptor;
	}
	//* Exec
	i=0, len= q.length;
	while(i<len){
		// Get step data
		var typeOrInput= q[i] as graphQlObject; // "type" or "input"
		var clazz= qObj[i++] as ClassFields|Record<string, FieldDescType>; // get current class
		try {
			// Get descriptor
			var descriptor= _getDescriptor(clazz);
			var descriptorFields= typeOrInput===graphQlObject.TYPE ? descriptor.typeFields! : descriptor.inputFields!;
			var fieldIt= Reflect.has(clazz, fieldSymb) ? (clazz as ClassFields)[fieldSymb].entries() : _iteratorFromObj(clazz as Record<string, FieldDescType>);
			while(true){
				// Get next entry
				var entry= fieldIt.next();
				if(entry.done) break;
				var [fieldKey, fieldValue]= entry.value;
				
				// Check if ignored
				if(typeOrInput === graphQlObject.TYPE){
					if(!fieldValue.read) continue; // this field is write only
				} else {
					if(!fieldValue.write || fieldValue.resolve) continue; // this field is read only
				}
				// Check for duplicate field name
				if(Reflect.has(descriptorFields, fieldKey))
					throw new Error(`Duplicate entry: ${clazz.name}::${fieldKey}`);
				// Get graphql type
				var {targetFieldGql, isNew, fieldType}= _parseGraphQlType(fieldValue, fieldKey, _getDescriptor, typeOrInput);
				// Parse in next step
				if(isNew){
					q.push(typeOrInput);
					qObj.push(fieldType);
					++len;
				}
				// add arguments
				var argV= fieldValue.arg;
				var targetInputArg: GraphQLFieldConfigArgumentMap|undefined= undefined;
				if(argV){
					var argIt: Iterator<[string, FieldArgSchema]>;
					if(typeof argV === 'function'){
						var argDescriptor= (argV as ClassFields)[fieldSymb];
						if(!argDescriptor) throw new Error(`Illegal argument at ${fieldKey}: ${argV.name}`);
						if(argDescriptor.size === 0) throw new Error(`Expected fields at ${fieldKey}: ${argV.name}`)
						argIt= argDescriptor.entries();
					} else {
						argIt= _iteratorFromObj(argV);
					}
					targetInputArg= {};
					while(true){
						var a= argIt.next()
						if(a.done) break;
						var [k, v]= a.value;
						// Get graphql type
						var {targetFieldGql: argFieldGql, isNew, fieldType}= _parseGraphQlType(v!, k, _getDescriptor, graphQlObject.INPUT);
						// Parse in next step
						if(isNew){
							q.push(graphQlObject.INPUT);
							qObj.push(fieldType);
							++len;
						}
						
						// Add arg
						targetInputArg[k]= {
							type:			argFieldGql as GraphQLInputType,
							defaultValue:	v.default,
							description:	v.comment
						};
					}
				}

				// Add field
				if(typeOrInput === graphQlObject.TYPE)
					descriptorFields[fieldKey]= {
						type:				targetFieldGql,
						args:				targetInputArg,
						resolve:			fieldValue.resolve,
						deprecationReason:	fieldValue.deprecated,
						description:		fieldValue.comment
					}
				else
					descriptorFields[fieldKey]= {
						type:				targetFieldGql,
						defaultValue:		fieldValue.default,
						description:		fieldValue.comment
					}
			}
		} catch (error) {
			if(typeof error === 'string')
				throw new Error(`Error at ${clazz.name}::${fieldKey}>> ${error}`);
		}
	}
	//* Return schema
	return new GraphQLSchema(resultSchema);
}


/** Create GraphQL enum */
const gqlEnumKeyRegex= /^[_a-zA-Z][_a-zA-Z0-9]*$/;
export function gqlEnum(name: string, enumObj: Record<string, string|number>, description?: string){
	var values: Record<string, {value: string|number}>= {}, k;
	for(k in enumObj){
		if(gqlEnumKeyRegex.test(k))
			values[k]= {value: enumObj[k]};
	}
	return new GraphQLEnumType({
		name,
		values: values,
		description
	});
}
