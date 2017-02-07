'use strict';
const gulp = require('gulp');
const fs = require('fs');
const browserify = require('browserify');
const sass = require('gulp-sass');
gulp.task('js', function() {
	return browserify('src/index.jsx')
		.transform("babelify", {presets: ['es2015', 'react']})
		.bundle()
		.pipe(fs.createWriteStream('build/index.js'));
});
gulp.task('sass', function() {
	return gulp.src('src/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('build'));
});
gulp.task('watch', ['default'], function() {
	gulp.watch('src/*.js', ['js']);
	gulp.watch('src/*.scss', ['sass']);
});
gulp.task('default', ['js', 'sass']);