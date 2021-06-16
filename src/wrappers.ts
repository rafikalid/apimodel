/**
 * @example
 * 		@has(role: string)
 */

import { GraphQLField, GraphQLFieldResolver, GraphQLObjectType, GraphQLType, GraphQLTypeResolver } from "graphql";
import { field } from "./field";
import { FieldSchema } from "./schema";

/** Define decorator */
// function(target: any, propertyKey: string, descriptor?: PropertyDescriptor)
export function fieldDecorator(decoratorObserver: DecoratorObserver, args:any[]){
	return field(new FieldSchema().addDecorator(decoratorObserver, args));
}

/** Decorator observer options */
export interface DecoratorObserver{
	/** Visite output field or object */
	outputField(resolver: GraphQLFieldResolver<any, any, any>, type: GraphQLType): GraphQLFieldResolver<any, any, any>

	/** Visite input scalar */
	intputField(parent: any, value: any, args:any): any
}


