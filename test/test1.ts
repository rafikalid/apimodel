import { ApolloServer, ServerInfo } from 'apollo-server';
import { arg, field, makeGraphQLSchema, max, gqlEnum, readOnly, writeOnly, type } from "../src";


enum Elements {
	EM1,
	EM2,
	EM3
}

class User {
	@field(String, 'User name')
	firstName?: string
	@field(String, max(20).min(2).comment('Last name'))
	lastName?: string
	@field(String, readOnly.comment("Full name or nick name"))
	fullName?: string
	@field(Number, writeOnly.comment("user's age"))
	age?: number
	@field(User, "Conjoin")
	conjoin?: User
	@field(String, max(300).comment("User's address"))
	address?: string
	@field(gqlEnum('Elements', Elements), 'Enum test')
	enumElement?: Elements
	@field([String], "Get skills")
	skills(parent: any, @arg({ test: type(String).comment('hello every body') }) args: any, context: any, infos: any) {
		// return args.test
		return ['lorem', 'ipsum', 'dolor', 'bo'];
	}
}

class FilterUser {
	@field(String, 'Filter by email')
	email?: string
	@field(String, "filter by cellPhone")
	cellPhone?: string
	@field(User, "Other fields")
	byUser?: User
}

class Query {
	@field(Boolean)
	flag1?: boolean

	@field(Boolean, 'Flag with comment')
	flag2?: boolean

	@field(String, 'String field')
	str?: string

	@field(User, "User")
	getUsers(parent: any, @arg(FilterUser) args: any, context: any, info: any) {
		console.log('--->>', args);
		return { firstName: 'khalid RAFIK' }
	}
}



var schema = makeGraphQLSchema({ Query: Query });
// console.log('SCHEMA.query>>', schema.toConfig().query?.toConfig());


const server = new ApolloServer({
	schema: schema,
	context: function ({ req, res }) {
		return {}
	},
	// dataSources: function(){ return Repositories.all },
	uploads: false,
	debug: true,
	// schemaDirectives,
	formatError: function (err) {
		console.error('ERR>>', err)
		//TODO format errors, Hide sensitive error data
		// if(isProd && !(err.originalError instanceof GError)){
		// Logger.fatalError('ERR', err);
		// 	err= new Error('Internal Error');
		// }
		// err= new ApolloError('Internal Error', 'InternalError');
		return err;
	},
	playground: {
		endpoint: '/api/v0',
		settings: {
			"request.credentials": "include"
		}
	},
	// mocks: true
});

// Run mock server
server.listen(3000)
	.then(function (obj: ServerInfo) {
		console.log(`>> Listening on: ${obj.url}`);
	})
	.catch(function (err: Error) {
		console.log('Failed to start the server >>', err);
		process.exit(1); // Close the app
	});
