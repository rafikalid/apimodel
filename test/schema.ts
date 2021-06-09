import { arg, field, max, outOnly, inOnly, type, required, requiredField } from "../src";

enum Elements {
	EM1,
	EM2,
	EM3
}

export class User {
	@field(String, required.comment('User name'))
	firstName?: string
	@field(String, max(20).min(2).comment('Last name'))
	lastName?: string
	@field(String, outOnly.comment("Full name or nick name"))
	fullName?: string
	@field(Number, inOnly.comment("user's age"))
	age?: number
	@field(User, "Conjoin")
	conjoin?: User
	@field(String, max(300).comment("User's address"))
	address?: string
	// @field(gqlEnum('Elements', Elements), 'Enum test')
	// enumElement?: Elements
	@field([String], "Get skills")
	skills(parent: any, @arg({ test: type(String).comment('hello every body') }) args: any, context: any, infos: any) {
		// return args.test
		return ['lorem', 'ipsum', 'dolor', 'bo'];
	}
}

export class FilterUser {
	@field(String, 'Filter by email')
	email?: string
	@field(String, "filter by cellPhone")
	cellPhone?: string
	@field(User, "Other fields")
	byUser?: User
}

export class Query {
	@field(Boolean)
	flag1?: boolean

	@field(Boolean, 'Flag with comment')
	flag2?: boolean

	@field(String, 'String field')
	str?: string

	@requiredField(User, "User")
	getUsers(parent: any, @arg(FilterUser) args: any, context: any, info: any) {
		console.log('--->>', args);
		return { firstName: 'khalid RAFIK' }
	}
}