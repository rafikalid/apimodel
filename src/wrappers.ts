/**
 * @example
 * 		@has(role: string)
 */

import { GraphQLField, GraphQLFieldResolver, GraphQLType } from "graphql";
import { doc } from "./field";
import { ClassType, EntityDescriptor } from "./schema";
import { fieldSymb } from "./symbols";

/** decorator descriptor  */
export interface decoratorDescriptor extends EntityDescriptor{
	decorator: Map<string, (DecoratorObserver|any[])[]>
}


/** Define decorator */
// function(target: any, propertyKey: string, descriptor?: PropertyDescriptor)
export function fieldDecorator(decoratorObserver: DecoratorObserver, args:any[]){
	return function(target: any, propertyKey: string){
		var constructor=  (typeof target === 'function'? target : target.constructor) as ClassType;
		if(!constructor.hasOwnProperty(fieldSymb))
			doc()(constructor);
		var deco= (constructor[fieldSymb] as decoratorDescriptor).decorator ??= new Map();
		var lst= deco.get(propertyKey);
		if(!lst){
			lst= [];
			deco.set(propertyKey, lst);
		}
		lst.push(decoratorObserver, args);
	}
}

/** Decorator observer options */
export interface DecoratorObserver{
	/** Visite output field or object */
	outputField(resolver: GraphQLFieldResolver<any, any, any>, args: any[], field: GraphQLField<any, any>, propertyKey: string, parentType: GraphQLType): GraphQLFieldResolver<any, any, any>

	/** Visite input scalar */
	intputField(parent: any, value: any, args:any): any
}
