import { ClassType, FieldSchema, FieldTypes, ObjectType } from "./schema";
import { fieldSymb } from "./symbols";

/** Schema node types */
export enum ShemaTypes{
	/** Object in initialization phase */
	INIT,
	OUTPUT_OBJECT,
	OUTPUT_LIST,
	OUTPUT_UNION,
	OUTPUT_METHOD,

	INPUT_OBJECT,
	INPUT_LIST,
	
	SCALAR, // Scalars && Basic values like: String, ....
}

/** Object fields */
export interface Field {
	/** Field name */
	name: string
	/** If reference to input or output object */
	refrence: string
}
export interface OutputField extends Field {
	value: OutputNode
}
export interface InputField extends Field {
	value: InputNode
}

/** Basic schema node */
export interface SchemaNode{
	/** Unique reference name */
	name:	string|undefined,
	/** Node type */
	type: ShemaTypes
	/** Required */
	required: boolean
	/** Comment */
	comment: string|undefined
}

export interface OutputNode extends SchemaNode{}
export interface InputNode extends SchemaNode{}

/** Output object type */
export interface OutputObject extends OutputNode{
	type:	ShemaTypes.OUTPUT_OBJECT
	fields: OutputField[]
}

/** Output list type */
export interface OutputList extends OutputNode{
	type:	ShemaTypes.OUTPUT_LIST
	data:	OutputNode
}

/** Output Method */
export interface OutputMethod extends OutputNode{
	/** List args */
	args: (InputField[]|undefined)[]
}

/** Input object type */
export interface InputObject extends InputNode{
	type:	ShemaTypes.INPUT_OBJECT
	fields: InputField[]
}

/** Input list */
export interface InputList extends InputNode{
	type:	ShemaTypes.INPUT_LIST
	data:	InputNode
}

/** Scalar */
export interface ScalarInterface extends OutputNode, InputNode{
	type:	ShemaTypes.SCALAR
}

/** Is output or input object */
enum ObjectInOut{ INPUT, OUTPUT };

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
	// Reference all classes
	const refMap: Map<string, OutputObject|InputObject>= new Map();
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
		if(currentNode instanceof Map)
			it= currentNode.entries();
		else if((currentNode as ClassType)[fieldSymb]!=null){
			it= (currentNode as ClassType)[fieldSymb]!.entries();
			if(typeof currentNode.name === 'string') currentNodeName= currentNode.name;
		} else 
			it= _objEntries(currentNode as Record<string, FieldSchema>);
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
							
						}):
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