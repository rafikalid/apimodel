import { ApolloServer, ServerInfo } from 'apollo-server';
import * as schema from './schema';
import { fieldSymb } from '../src/symbols';

console.log('---- USER', (schema.User as any)[fieldSymb])



// var schema = makeGraphQLSchema({ Query: Query });
// // console.log('SCHEMA.query>>', schema.toConfig().query?.toConfig());


// const server = new ApolloServer({
// 	schema: schema,
// 	context: function ({ req, res }) {
// 		return {}
// 	},
// 	// dataSources: function(){ return Repositories.all },
// 	uploads: false,
// 	debug: true,
// 	// schemaDirectives,
// 	formatError: function (err) {
// 		console.error('ERR>>', err)
// 		//TODO format errors, Hide sensitive error data
// 		// if(isProd && !(err.originalError instanceof GError)){
// 		// Logger.fatalError('ERR', err);
// 		// 	err= new Error('Internal Error');
// 		// }
// 		// err= new ApolloError('Internal Error', 'InternalError');
// 		return err;
// 	},
// 	playground: {
// 		endpoint: '/api/v0',
// 		settings: {
// 			"request.credentials": "include"
// 		}
// 	},
// 	// mocks: true
// });

// // Run mock server
// server.listen(3000)
// 	.then(function (obj: ServerInfo) {
// 		console.log(`>> Listening on: ${obj.url}`);
// 	})
// 	.catch(function (err: Error) {
// 		console.log('Failed to start the server >>', err);
// 		process.exit(1); // Close the app
// 	});
