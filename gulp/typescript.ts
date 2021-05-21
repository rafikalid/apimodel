/**
 * Compile Typescript files
 */
import {src, dest, lastRun} from 'gulp';
import GulpTypescript from 'gulp-typescript';
import SrcMap from 'gulp-sourcemaps';

//TODO Get "isProd" from CLI
const isProd= false;
const TsProject = GulpTypescript.createProject('tsconfig.json', {removeComments: isProd, pretty: !isProd});
// import babel from 'gulp-babel';

export default function typescriptCompile(){
	return src('src/**/*.ts', {nodir: true, since: lastRun(typescriptCompile)})
		.pipe(SrcMap.init())
		.pipe(TsProject())
		.pipe(SrcMap.write('.'))
		.pipe(dest('dist'));
}