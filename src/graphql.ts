import { GraphQLInputObjectType, GraphQLObjectType, GraphQLInputFieldConfigMap, GraphQLFieldConfigMap, GraphQLOutputType, GraphQLInputType, GraphQLString, GraphQLFloat, GraphQLBoolean, GraphQLScalarType, GraphQLEnumType, GraphQLList, GraphQLNonNull, GraphQLFieldConfigArgumentMap, GraphQLFieldResolver, GraphQLInputFieldMap, GraphQLSchema, GraphQLUnionType, GraphQLArgumentConfig, GraphQLEnumValueConfigMap } from "graphql";
import { ClassType, FieldSchema, FieldTypes, ObjectType, FieldListDescriptor, FieldRefDescriptor } from "./schema";
import { fieldSymb } from "./symbols";
import { Union } from "./union";


/** Is output or input object */
enum ObjectInOut{
	/** Output object */
	OUTPUT,
	/** Input object */
	INPUT,
	/** Input root object as argument for resolver and subscription */
	ARG
};
/** add node name postfix */
function _nodeNamePostfix(name: string, type: ObjectInOut): string{
	switch(type){
		case ObjectInOut.INPUT:
			name+= 'Input';
			break;
		case ObjectInOut.ARG:
			name+= '_Arg';
			break;
	}
	return name;
}
/** Map objects with data info */
interface MappedObjInfo{
	fields:	GraphQLFieldConfigMap<any, any>|GraphQLInputFieldConfigMap
	gql?:	GraphQLObjectType|GraphQLInputObjectType
}
/** Wrappers */
enum WrappedQueueWrappers{ LIST, NON_NULL }

/** Compile schema */
export function compileGqlSchema(args: Record<string, ObjectType>[]){
	// Object resolving queue
	const queue: ObjectType[]= [];
	const queueN: string[]= [];
	const queueT: ObjectInOut[]= []; // 
	// Reference all classes with mapped fields
	const refMap: Map<string, MappedObjInfo>= new Map();
	const foundEntities: Set<any>[]= [
		new Set(), // ObjectInOut.OUTPUT
		new Set(), // ObjectInOut.INPUT
		new Set() //  ObjectInOut.ARG
	];
	// Add Objects
	var i: number, len: number, arg:Record<string, ObjectType>, argObj: ObjectType;
	var entitySet= foundEntities[ObjectInOut.OUTPUT]
	for(i=0, len= args.length; i<len; ++i){
		arg= args[i];
		Reflect.ownKeys(arg).forEach(argK=>{
			if(typeof argK==='string' && argK.charAt(0)!=='_'){
				argObj= arg[argK];
				if(entitySet.has(argObj)){}
				else{
					entitySet.add(argObj);
					// Add to the queue
					queue.push(argObj);
					queueN.push(argK);
					queueT.push(ObjectInOut.OUTPUT);
				}
			}
		});
	}
	// Generate unique names for entities
	const uniqueNames: Map<string, number> = new Map();
	function _getUniqueName(name: string){
		var n= uniqueNames.get(name);
		if(n==null) n= 0;
		uniqueNames.set(name, n);
		name= `${name}_${n}`;
		return name;
	}
	// Generate reference for doc
	function _genRef(ref: any, fieldKey: string, nodeType: ObjectInOut): string{
		// Generate reference
		var refName:string;
		if(typeof ref === 'function'){
			refName= ref.name;
			if((ref as ClassType)[fieldSymb] == null)
				throw new Error(`Missing fields on entity: ${refName}.`);
		} else {
			refName= _getUniqueName(fieldKey);
		}
		//Add to queue
		var entitySet= foundEntities[nodeType];
		if(entitySet.has(ref)){
		} else{
			entitySet.add(ref);
			queue.push(ref);
			queueN.push(refName);
			queueT.push(nodeType);
			++len;
		}
		return refName;
	}
	// Get/create node
	function _getNode(nodeName: string, nodeType: ObjectInOut): MappedObjInfo{
		var nodeEl= refMap.get(nodeName)!;
		if(nodeEl==null){
			var nodeFields= {};
			if(nodeType=== ObjectInOut.OUTPUT){
				//* OUTPUT
				nodeEl= {
					fields: nodeFields,
					gql: new GraphQLObjectType({
						fields: nodeFields as GraphQLFieldConfigMap<any, any>,
						name: nodeName,
						// description: '' //TODO
					})
				};
			} else if (nodeType === ObjectInOut.ARG) {
				// Argument
				nodeEl= {
					fields: nodeFields
				};
			} else {
				//* INPUT
				nodeEl={
					fields: nodeFields,
					gql: new GraphQLInputObjectType({
						fields: nodeFields as GraphQLInputFieldConfigMap ,
						name:	nodeName,
						// description: '' //TODO
					})
				}
			}
			refMap.set(nodeName, nodeEl);
		}
		return nodeEl;
	}
	// Union resolver
	const _unionMap: Map<Union, GraphQLUnionType>= new Map();
	function _genUnion(union: Union):GraphQLUnionType{
		var result= _unionMap.get(union);
		if(result==null){
			// Resolve types
			var unionTypes= union._types;
			var unionGraphQlTypes: GraphQLObjectType[]= [];
			var unionResolver= union._resolver;
			var unionType, unionK;
			var refNode, targetFieldGql;
			for(unionK in unionTypes){
				unionType= unionTypes[unionK];
				//* Input or Output Object
				if(typeof unionType !== 'string')
					unionType= _genRef(unionType, 'unknown', ObjectInOut.OUTPUT);
				// Load reference
				refNode= _getNode(unionType, ObjectInOut.OUTPUT);
				targetFieldGql= refNode.gql;
				unionGraphQlTypes.push(targetFieldGql as GraphQLObjectType<any, any>);
			}
			// Create union
			result= new GraphQLUnionType({
				name:	union._name,
				types:	unionGraphQlTypes,
				description:	union._description,
				resolveType(value:any){
					return unionGraphQlTypes[unionResolver(value)];
				}
			});
			_unionMap.set(union, result);
		}
		return result;
	}
	// Compile
	i=0, len= queue.length;
	var currentNode: ObjectType, currentNodeName: string, currentNodeType: ObjectInOut;
	var it: IterableIterator<[string, FieldSchema]>;
	var node:		MappedObjInfo;
	var refNode:	MappedObjInfo;
	var fields:	GraphQLFieldConfigMap<any, any>|GraphQLInputFieldConfigMap|GraphQLFieldConfigArgumentMap;
	while(i<len){
		// Load current node
		currentNode= queue[i];
		currentNodeName= queueN[i];
		currentNodeType= queueT[i];
		if(currentNode== null)
			throw new Error(`Enexpected undefined value at: ${currentNodeName}`);
		var nextNodeType= currentNodeType===ObjectInOut.ARG? ObjectInOut.INPUT : currentNodeType;
		++i; // Next
		// Check 
		if(currentNodeName.endsWith('Input'))
			throw new Error(`Entity name could not ends with "Input" keyword: ${currentNodeName}`);
		if(currentNodeName.endsWith('_Arg'))
			throw new Error(`Entity name could not ends with "_Arg" keyword: ${currentNodeName}`);
		// get map iterator
		var autoName= true;
		if(currentNode instanceof Map)
			it= currentNode.entries();
		else if((currentNode as ClassType)[fieldSymb]!=null){
			var entityDesc= (currentNode as ClassType)[fieldSymb]!;
			it= entityDesc.fields.entries();
			if(typeof entityDesc.name=== 'string'){
				currentNodeName= entityDesc.name;
				autoName= false;
			}else if(typeof currentNode.name === 'string'){
				currentNodeName= currentNode.name;
				autoName= false;
			}
		} else 
			it= _objEntries(currentNode as Record<string, FieldSchema>);
		// Generate unique name
		if(autoName)
			currentNodeName= _getUniqueName(currentNodeName);
		// Add "Input" postfix
		currentNodeName= _nodeNamePostfix(currentNodeName, currentNodeType);
		// Get/Create Graphql object
		node= _getNode(currentNodeName, currentNodeType);
		fields= node.fields;
		// Go through fields
		while(true){
			// Get next entry
			var entry= it.next();
			if(entry.done) break;
			var [fieldKey, fieldValue]= entry.value;
			var fieldSchema= fieldValue._
			var rootFieldSchema= fieldSchema;
			// Check for duplicate fields
			if(Reflect.has(fields, fieldKey))
				throw new Error(`Duplicate field: ${currentNodeName}::${fieldKey}`);
			// Check for lists && requireds
			var wrappersQueue= []; // wrapped with list or nonNull
			while(true){
				// Add required wrapper
				if(fieldSchema.required) wrappersQueue.push(WrappedQueueWrappers.NON_NULL);
				if(fieldSchema.type===FieldTypes.LIST){
					wrappersQueue.push(WrappedQueueWrappers.LIST);
					fieldSchema= (fieldSchema as FieldListDescriptor).items
				} else {
					break;
				}
			}
			// Check the reference
			var targetFieldGql: GraphQLOutputType | GraphQLInputType;
			var ref= (fieldSchema as FieldRefDescriptor).ref;
			//* Basic data
			if(typeof ref==='undefined')
				throw new Error(`Missing reference on : ${currentNodeName}::${fieldKey}`);
			else if(ref === String)
				targetFieldGql= GraphQLString;
			else if(ref === Number)
				targetFieldGql= GraphQLFloat;
			else if(ref === Boolean)
				targetFieldGql= GraphQLBoolean;
			//* Scalar or enum
			else if(ref instanceof GraphQLScalarType || ref instanceof GraphQLEnumType)
				targetFieldGql= ref;
			//* Union
			else if(ref instanceof Union)
				targetFieldGql= _genUnion(ref);
			else {
				//* Input or Output Object
				if(typeof ref !== 'string')
					ref= _genRef(ref, fieldKey, nextNodeType);
				// Load reference
				ref= _nodeNamePostfix(ref, nextNodeType);
				refNode= _getNode(ref, nextNodeType);
				targetFieldGql= refNode.gql!;
			}
			// Wrap with list and nonNull
			var wrappersQueueI= wrappersQueue.length;
			while(--wrappersQueueI >=0){
				switch(wrappersQueue[wrappersQueueI]){
					case WrappedQueueWrappers.LIST:
						targetFieldGql= new GraphQLList(targetFieldGql);
						break
					case WrappedQueueWrappers.NON_NULL:
						targetFieldGql= new GraphQLNonNull(targetFieldGql);
						break
					default:
						throw new Error(`Illegal value for switch: ${wrappersQueue[wrappersQueueI]}`);		
				}
			}
			//Check for resolver args
			var fieldResolverArgs: GraphQLFieldConfigArgumentMap|undefined= undefined;
			var argV: any= rootFieldSchema.args;
			if(argV){
				//* Argument
				var argRef= argV._.ref;
				if(argRef == null)
					throw new Error(`Missing arg at ${currentNodeName}::${fieldKey}`);
				if(typeof argRef !== 'string'){
					argRef= _genRef(argRef, fieldKey, ObjectInOut.ARG);
				}
				argRef+= '_Arg';
				// Load reference
				var argNode= _getNode(argRef, ObjectInOut.ARG);
				fieldResolverArgs= argNode.fields as GraphQLFieldConfigArgumentMap;
			}
			// create field
			if(currentNodeType=== ObjectInOut.OUTPUT)
				(fields as GraphQLFieldConfigMap<any, any>)[fieldKey]= {
					type:				targetFieldGql as GraphQLOutputType,
					args:				fieldResolverArgs,
					resolve:			rootFieldSchema.resolver as GraphQLFieldResolver<any, any, { [argName: string]: any; }>,
					subscribe:			rootFieldSchema.subscribe as GraphQLFieldResolver<any, any, { [argName: string]: any; }>,
					deprecationReason:	rootFieldSchema.deprecated,
					description:		rootFieldSchema.comment
				};
			else if(currentNodeType === ObjectInOut.ARG)
				(fields as GraphQLFieldConfigArgumentMap)[fieldKey]= {
					type:				targetFieldGql as GraphQLInputType,
					defaultValue:		rootFieldSchema.default,
					description:		rootFieldSchema.comment,
					deprecationReason:	rootFieldSchema.deprecated
				}
			else
				(fields as GraphQLInputFieldMap)[fieldKey]= {
					name:				rootFieldSchema.name || fieldKey,
					type:				targetFieldGql as GraphQLInputType,
					defaultValue:		rootFieldSchema.default,
					description:		rootFieldSchema.comment,
					deprecationReason:	rootFieldSchema.deprecated,
					extensions:			undefined
				};
		}
	}
	// Return Graphql schema
	return new GraphQLSchema({
		query:			refMap.get('Query')?.gql as GraphQLObjectType<any, any>|undefined,
		mutation:		refMap.get('Mutation')?.gql as GraphQLObjectType<any, any>|undefined,
		subscription:	refMap.get('Subscription')?.gql as GraphQLObjectType<any, any>|undefined
	});
}

/** Get object entries iterator */
function* _objEntries(obj: Record<string, FieldSchema>): IterableIterator<[string, FieldSchema]>{
	var k: string, v: any;
	for(k in obj){
		v= obj[k];
		if(!(v instanceof FieldSchema))
			v= new FieldSchema().type(v);
		yield [k, v];
	}
}

/** Convert enum properties into string */
export type strEnumProps<T> ={
	[k in keyof T]: string
};

/** Generate Graphql enumerations */
const gqlEnumKeyRegex= /^[^\d]/;
export function gqlEnum(name: string, enumMap: Record<string, string|number>, enumDesc?: Record<string, string>): GraphQLEnumType
export function gqlEnum(name: string, description:string, enumMap: Record<string, string|number>, enumDesc?: Record<string, string>): GraphQLEnumType
export function gqlEnum(name: string, a:any, b?: any, c?: any){
	// Load params
	var description, enumMap, enumDesc;
	if(typeof a=== 'string'){
		description= a;
		enumMap= b;
		enumDesc= c;
	} else {
		enumMap= a;
		enumDesc= b;
	}
	// Create values
	var values: GraphQLEnumValueConfigMap= {};
	var k;
	if(enumDesc)
		for(k in enumMap)
			if(typeof k=== 'string' && gqlEnumKeyRegex.test(k))
				values[k]= {
					value:			enumMap[k],
					description:	enumDesc[k]
				};
	else
		for(k in enumMap)
			if(typeof k=== 'string' && gqlEnumKeyRegex.test(k))
				values[k]= { value:	enumMap[k] };
	// Create enum
	return new GraphQLEnumType({
		name,
		description,
		values: values
		// extensions?: Maybe<Readonly<GraphQLEnumTypeExtensions>>;
		// astNode?: Maybe<EnumTypeDefinitionNode>;
		// extensionASTNodes?: Maybe<ReadonlyArray<EnumTypeExtensionNode>>;
	});
}
