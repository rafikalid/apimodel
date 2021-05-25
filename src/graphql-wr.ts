import { GraphQLBoolean, GraphQLEnumType, GraphQLFieldConfig, GraphQLFieldConfigArgumentMap, GraphQLFloat, GraphQLInputObjectType, GraphQLInputType, GraphQLInt, GraphQLObjectType, GraphQLOutputType, GraphQLScalarType, GraphQLSchema, GraphQLString } from 'graphql';
import { FieldArgSchema } from './field';
import {DocSymb, fieldSymb} from './symbols';

/** Basic types */
export const Int= GraphQLInt
export const Float= GraphQLFloat

/** Schema basic data */
interface ClassFields extends Function {
	[fieldSymb]: Map<string, FieldArgSchema>,
	[DocSymb]?:string
}
type SchemaType= {Query?: Function, Mutation?: Function}

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
function _parseGraphQlType(fieldValue: FieldArgSchema, mapClasses: Map<Function, mapClassInterface>, typeOrInput: graphQlObject){
	// Field type
	var fieldType= fieldValue.type!
	var targetFieldGql: GraphQLOutputType | GraphQLInputType;
	var nextDescriptorFields;
	var isNew= false;
	//* Scalar or enum
	if(fieldType instanceof GraphQLScalarType || fieldType instanceof GraphQLEnumType){
		targetFieldGql= fieldType;
	}
	//* Doc input
	else if((fieldType as ClassFields)[fieldSymb]){
		// Next mapper
		var mapperClazz= fieldType
		if(mapperClazz.name === 'Query')			mapperClazz= TYPE_QUERY;
		else if(mapperClazz.name === 'Mutation')	mapperClazz= TYPE_MUTATION;
		// Next object descriptor
		var nextDescriptor= mapClasses.get(mapperClazz);
		if(!nextDescriptor){
			nextDescriptor= {
				typeFields:	undefined, // map gqlType fields
				gqlType:	undefined, // Mapped object
				inputFields: undefined, // map gqlType fields
				gqlInput:	undefined // Mapped input
			};
			mapClasses.set(mapperClazz, nextDescriptor);
		}
		// next object fields
		if(typeOrInput===graphQlObject.TYPE){
			nextDescriptorFields= nextDescriptor.typeFields
			if(!nextDescriptorFields){
				isNew= true;
				nextDescriptorFields= {};
				nextDescriptor.typeFields= nextDescriptorFields;
				nextDescriptor.gqlType= new GraphQLObjectType({
					name: fieldType.name,
					fields: nextDescriptorFields,
					description: (fieldType as ClassFields)[DocSymb]
				});
			}
			targetFieldGql= nextDescriptor.gqlType!;
		} else {
			nextDescriptorFields= nextDescriptor.inputFields
			if(!nextDescriptorFields){
				isNew= true;
				nextDescriptorFields= {};
				nextDescriptor.inputFields= nextDescriptorFields;
				nextDescriptor.gqlInput= new GraphQLInputObjectType({
					name: `${fieldType.name}Input`,
					fields: nextDescriptorFields,
					description: (fieldType as ClassFields)[DocSymb]
				});
			}
			targetFieldGql= nextDescriptor.gqlInput!
		}
	}
	else if(fieldType === Number)
		targetFieldGql= GraphQLFloat;
	else if(fieldType === String)
		targetFieldGql= GraphQLString
	else if(fieldType === Boolean)
		targetFieldGql= GraphQLBoolean
	else
		throw `Illegal type: ${fieldType}`;
	return {
		targetFieldGql: targetFieldGql,
		isNew: isNew
	}
}

/** Generating graphql schema */
export function makeGraphQLSchema(... args: SchemaType[]){
	//* Prepare Queries and mutations
	var q= [], qObj= [];
	var i, len, arg;
	var hasQuery= false;
	var hasMutation= false;
	for(i=0, len= args.length; i<len; i++){
		arg= args[i];
		if(arg.Query) {
			q.push(graphQlObject.TYPE);
			qObj.push(arg.Query);
			hasQuery= true;
		}
		if(arg.Mutation) {
			q.push(graphQlObject.TYPE);
			qObj.push(arg.Mutation);
			hasMutation= true;
		}
	}
	if(q.length===0) throw new Error('No Query or Mutation found!');

	// Go through queue
	/** Map types to classes */
	const mapClasses: Map<Function, mapClassInterface>= new Map();
	
	/** Add basic mappers */
	var mField;
	if(hasQuery){
		mField= {};
		mapClasses.set(TYPE_QUERY, {
			typeFields:	mField, // map gqlType fields
			gqlType:	 new GraphQLObjectType({name: 'RootQueryType', fields: mField}), // Mapped object
			inputFields: undefined, // map gqlType fields
			gqlInput:	undefined // Mapped input
		});
	}
	if(hasMutation){
		mField= {};
		mapClasses.set(TYPE_MUTATION, {
			typeFields:	mField, // map gqlType fields
			gqlType:	new GraphQLObjectType({name: 'RootMutationType', fields: mField}), // Mapped object
			inputFields: undefined, // map gqlType fields
			gqlInput:	undefined // Mapped input
		});
	}

	/** Mark classes as visited */
	i=0, len= q.length;
	while(i<len){
		// Get step data
		var typeOrInput= q[i] as graphQlObject; // "type" or "input"
		var clazz= qObj[i++] as ClassFields; // get current class
		try {
			// Get mapper
			var mapperClazz: Function= clazz
			if(mapperClazz.name === 'Query')			mapperClazz= TYPE_QUERY;
			else if(mapperClazz.name === 'Mutation')	mapperClazz= TYPE_MUTATION;
			//* Get field descriptor
			var descriptor= mapClasses.get(mapperClazz)!;
			var descriptorFields= typeOrInput===graphQlObject.TYPE ? descriptor.typeFields! : descriptor.inputFields!;
			
			//* Get fields
			var fields= clazz[fieldSymb];
			if(!fields) throw new Error(`Expected fields on class: ${clazz.name}`);
			//* Add fields
			var fieldIt= fields.entries();
			while(true){
				// Get next entry
				var entry= fieldIt.next();
				if(entry.done) break;
				var [fieldKey, fieldValue]= entry.value;
				// Check if ignored
				if(typeOrInput === graphQlObject.TYPE){
					if(!fieldValue.read) continue; // this field is write only
				} else {
					if(!fieldValue.write) continue; // this field is read only
				}
				// Check for duplicate field name
				if(Reflect.has(descriptorFields, fieldKey))
					throw new Error(`Duplicate entry: ${clazz.name}::${fieldKey}`);
				// Get graphql type
				var {targetFieldGql, isNew}= _parseGraphQlType(fieldValue, mapClasses, typeOrInput);
				// Parse in next step
				if(isNew){
					q.push(typeOrInput);
					qObj.push(fieldValue.type!);
					++len;
				}
				// add arguments
				var argV= fieldValue.arg;
				var targetInputArg: GraphQLFieldConfigArgumentMap|undefined= undefined;
				if(argV){
					var argDescriptor= argV[fieldSymb];
					if(!argDescriptor) throw new Error(`Illegal argument at ${fieldKey}: ${argV.name}`);
					if(argDescriptor.size === 0) throw new Error(`Expected fields at ${fieldKey}: ${argV.name}`)
					targetInputArg= {};
					var argIt= argDescriptor.entries();
					while(true){
						var a= argIt.next()
						if(a.done) break;
						var [k, v]= a.value;
						// Get graphql type
						var {targetFieldGql: argFieldGql, isNew}= _parseGraphQlType(v, mapClasses, graphQlObject.INPUT);
						// Parse in next step
						if(isNew){
							q.push(graphQlObject.INPUT);
							qObj.push(v.type!);
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
				descriptorFields[fieldKey]= {
					type:				targetFieldGql,
					args:				targetInputArg,
					resolve:			fieldValue.resolve,
					deprecationReason:	fieldValue.deprecated,
					description:		fieldValue.comment
				}
			}
		} catch (error) {
			if(typeof error === 'string')
				throw new Error(`Error at ${clazz.name}::${fieldKey}>> ${error}`);
		}
	}
	//* Return schema
	return new GraphQLSchema({
		query:		hasQuery ? mapClasses.get(TYPE_QUERY)!.gqlType : undefined,
		mutation:	hasMutation ? mapClasses.get(TYPE_MUTATION)!.gqlType : undefined
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