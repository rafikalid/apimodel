import { GraphQLInputObjectType, GraphQLObjectType, GraphQLInputFieldConfigMap, GraphQLFieldConfigMap } from "graphql";
import { ClassType, FieldSchema, ObjectType } from "./schema";
import { fieldSymb } from "./symbols";


/** Is output or input object */
enum ObjectInOut{ INPUT, OUTPUT };

/** Map objects with data info */
interface MappedObjInfo{
	fields:	GraphQLFieldConfigMap<any, any>|GraphQLInputFieldConfigMap
	gql:	GraphQLObjectType|GraphQLInputObjectType
}

/** Compile schema */
export function compile(args: Record<string, ObjectType>[]){
	// Object resolving queue
	const queue: ObjectType[]= [];
	const queueN: string[]= [];
	const queueT: ObjectInOut[]= []; // 
	// Add Objects
	var i, len, arg:Record<string, ObjectType>;
	for(i=0, len= args.length; i<len; ++i){
		arg= args[i];
		Reflect.ownKeys(arg).forEach(argK=>{
			if(typeof argK==='string'){
				queue.push(arg[argK]);
				queueN.push(argK);
				queueT.push(ObjectInOut.OUTPUT);
			}
		});
	}
	// Generate unique names for entities
	const uniqueNames: Map<string, number> = new Map();
	// Reference all classes with mapped fields
	const refMap: Map<string, MappedObjInfo>= new Map();
	var node:	MappedObjInfo;
	var fields:	GraphQLFieldConfigMap<any, any>|GraphQLInputFieldConfigMap;
	// Compile
	i=0, len= queue.length;
	var currentNode: ObjectType, currentNodeName: string, currentNodeType: ObjectInOut;
	var it: IterableIterator<[string, FieldSchema]>;
	while(i<len){
		// Load current node
		currentNode= queue[i];
		currentNodeName= queueN[i];
		currentNodeType= queueT[i];
		++i; // Next
		// get map iterator
		var autoName= true;
		if(currentNode instanceof Map)
			it= currentNode.entries();
		else if((currentNode as ClassType)[fieldSymb]!=null){
			it= (currentNode as ClassType)[fieldSymb]!.entries();
			if(typeof currentNode.name === 'string'){
				currentNodeName= currentNode.name;
				autoName= false;
			}
		} else 
			it= _objEntries(currentNode as Record<string, FieldSchema>);
		// Add "Input" postfix
		if(currentNodeType===ObjectInOut.INPUT)
			currentNodeName+= 'Input';
		// Generate unique name
		if(autoName){
			var n= uniqueNames.get(currentNodeName);
			if(n==null) n= 0;
			uniqueNames.set(currentNodeName, n);
			currentNodeName= `${currentNodeName}_${n}`;
		}
		// Get/Create Graphql object
		node= refMap.get(currentNodeName)!;
		if(node==null){
			fields= {};
			if(currentNodeType=== ObjectInOut.OUTPUT){
				//* OUTPUT
				node= {
					fields: fields,
					gql: new GraphQLObjectType({
						fields: fields as GraphQLFieldConfigMap<any, any>,
						name: currentNodeName,
						// description: '' //TODO
					})
				};
			} else {
				//* INPUT
				node={
					fields: fields,
					gql: new GraphQLInputObjectType({
						fields: fields as GraphQLInputFieldConfigMap ,
						name:	currentNodeName,
						// description: '' //TODO
					})
				}
			}
			refMap.set(currentNodeName, node);
		} else {
			fields= node.fields;
		}
		








		// Create object
		if(currentNodeType===ObjectInOut.INPUT)
			currentNodeName+= 'Input'; // Add input prefix to this class name
		var doc:InputObject|OutputObject= refMap.get(currentNodeName)!;
		if(!doc){
			doc={
				name:	currentNodeName,
				type:	currentNodeType=== ObjectInOut.INPUT ? ShemaTypes.INPUT_OBJECT : ShemaTypes.OUTPUT_OBJECT,
				required: true, // TODO check if those are usable
				comment: '', // TODO check if those are usable
				fields: []
			};
			refMap.set(currentNodeName, doc);
		}
		var fields= doc.fields;
		// Loop on fields
		while(true){
			// Get next entry
			var entry= it.next();
			if(entry.done) break;
			var [fieldKey, fieldValue]= entry.value;
			var fieldSchema= fieldValue._
			// Check if ignored and create object
			if(currentNodeType===ObjectInOut.OUTPUT){
				if(!fieldSchema.output) continue; // this field is input only
				switch(fieldSchema.type){
					case FieldTypes.LIST:
						fields.push({
							name: fieldKey,
							type: ShemaTypes.OUTPUT_LIST,
							required: fieldSchema.required,
							comment: fieldSchema.comment,
							data:	OutputNode
						})
						break;
					case FieldTypes.UNION:
						break;
					case FieldTypes.REF:
						break;
					default:
						throw new Error(`Enexpected type: ${fieldSchema.type}`);
				}
			} else if(currentNodeType===ObjectInOut.INPUT){
				if(!fieldSchema.input) continue; // this field in output only
				switch(fieldSchema.type){
					case FieldTypes.LIST:
						break;
					case FieldTypes.UNION:
						break;
					case FieldTypes.REF:
						break;
					default:
						throw new Error(`Enexpected type: ${fieldSchema.type}`);
				}
			}
			// 
		}
	}
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