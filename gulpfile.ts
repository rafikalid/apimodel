'use strict';
import {watch, series, parallel} from 'gulp';
// import babel from 'gulp-babel';

import compileTypescript from './gulp/typescript'

const argv= process.argv;
const doWatch= !argv.includes('--nowatch');

/** Watch modified files */
function watchCb(cb: Function){
	if(doWatch){
		watch('src/**/*.ts', compileTypescript);
	}
	cb()
}

export default series([
	compileTypescript,
	watchCb
]);
