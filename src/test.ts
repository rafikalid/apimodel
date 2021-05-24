/** @tobe removed */

function deco(s: string){
	console.log('****** Create facto', s)
	return function(target: any, propertyKey: string, descriptor?: PropertyDescriptor){
		console.log('*---- Called:', s);
		console.log('--', target.constructor);
		
	}
}

class A{
	@deco('from class A')
	prop1?: string
}

function cc(): typeof A{
	class B extends A{
		@deco('from class B')
		prop1?: string
		@deco('from class B2')
		static prop3: string
	}
	return B;
}


console.log('--- begin');
const B= cc()
new B()
console.log('---CCC');
new B();
console.log('--- end.');

