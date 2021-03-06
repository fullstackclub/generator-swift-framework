'use strict';

var gulp = require('gulp');
var replace = require('gulp-replace');
var git = require('gulp-git');
var mocha = require('gulp-mocha');
var shell = require('gulp-shell');

gulp.task('default', ['test']);

gulp.task('test', ['test-unit', 'test-templates']);

gulp.task('test-unit', function () {
    gulp.src('test/*.js')
        .pipe(mocha());
});

gulp.task('test-templates', ['templatify'], function () {
    git.status({
        args: '--porcelain --untracked-files=no'
    }, function (err, stdout) {
        if (stdout) {
            throw new Error('templates are dirty, run `gulp templates` before submit');
        }
    });
});

// Revert tempaltes to a noraml Xcode project, which can be opened via Xcode
gulp.task('open-template-project', function () {
    gulp.src(['generators/app/templates/**', '!generators/app/templates/Carthage/**/*'])
        .pipe(replace(/<%= organizationId %>.<%= projectName %>/g, 'ORGANIZATION-ID.PROJECT-NAME'))
        .pipe(replace(/<%= projectName %>/g, 'PROJECT_NAME'))
        .pipe(replace(/<%= organizationName %>/g, 'ORGANIZATION_NAME'))
        .pipe(replace(/<%= organizationId %>/g, 'ORGANIZATION-ID'))
        .pipe(gulp.dest('generators/app/templates'))
        .pipe(shell('open generators/app/templates/PROJECT_NAME.xcodeproj'));
});

gulp.task('templatify', function () {
    // # Xcode replace '_' to '-' for Bundle Identifier
    gulp.src(['generators/app/templates/**/*', '!generators/app/templates/Carthage/**/*'])
        .pipe(replace(/ORGANIZATION-ID.PROJECT-NAME/g, '<%= organizationId %>.<%= projectName %>'))
        .pipe(replace(/PROJECT_NAME/g, '<%= projectName %>'))
        .pipe(replace(/ORGANIZATION_NAME/g, '<%= organizationName %>'))
        .pipe(replace(/ORGANIZATION-ID/g, '<%= organizationId %>'))
        .pipe(gulp.dest('generators/app/templates'));
});
