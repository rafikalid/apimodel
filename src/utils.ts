import {FieldArgSchema, FieldDescType, FieldSchema} from './field'
/** @private create iterator from object */
export function *_iteratorFromObj(obj: Record<string, FieldDescType>): Iterator<[string, FieldArgSchema]>{
	var k: string, v: any;
	for(k in obj){
		v= obj[k];
		if(v instanceof FieldSchema)
			yield [k, v.build()]
		else
			yield [k, {
				type:	v,
				read:	true,
				write:	true,
				comment: undefined
			}];
	}
}