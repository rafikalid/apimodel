/** Schema node types */
export enum ShemaTypes{
	OUTPUT_OBJECT,
	OUTPUT_LIST,
	OUTPUT_UNION,
	OUTPUT_METHOD,
	OUTPUT_SCALAR, // Scalars && Basic values like: String, ....

	INPUT_OBJECT,
	INPUT_LIST,
	INPUT_SCALAR, // Scalars && Basic values like: String, ....
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

/** Output scalar */
export interface Outputscalar extends OutputNode{
	type:	ShemaTypes.OUTPUT_SCALAR
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

/** Input scalar */
export interface InputScalar extends InputNode{
	type:	ShemaTypes.INPUT_SCALAR
}