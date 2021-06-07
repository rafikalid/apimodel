type FieldArgScema= string | Function | Record<string, FieldSchema>
/** Generate field schema */
function field(schema: FieldSchema, comment?: string): Function;
function field(type: FieldDescType|RegExp|string, schema?: FieldSchema | string): Function;
function field(type: FieldDescType|RegExp|string, schema: FieldSchema, comment: string): Function;
function field(type: any, schema?: any, comment?: string){
	/** Init type */
	schema= _createSchema(type, schema);
	if(typeof comment === 'string')
		schema.comment(comment);
	/** Apply */
	return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor){
		_getBuiltSchema(target, schema as FieldSchema, propertyKey);
	}
}