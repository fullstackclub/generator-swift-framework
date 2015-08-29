'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var os = require('os');

function noFilesContent(files, pattern) {

    files.forEach(function (file) {
        assert.noFileContent(file, pattern);
    });
}

describe('swift.framework:app', function () {

    // Placeholders
    var pattern = /(PROJECT-NAME|PROJECT_NAME|ORGANIZATION-ID|ORGANIZATION_NAME|<%=|%>)/;

    describe('with all features enabled', function () {
        before(function (done) {
            helpers.run(path.join(__dirname, '../generators/app'))
                .withOptions({
                    skipInstall: true
                })
                .withPrompts({
                    projectName: 'example',
                    organizationName: 'example-org',
                    organizationId: 'org.example',
                    cocoapods: true,
                    githubUser: 'gu',
                })
                .on('end', done);
        });

        it('creates Xcode project', function () {

            // Xcode project
            var files = [
                'example.xcodeproj/project.pbxproj',
                'example.xcodeproj/project.xcworkspace/contents.xcworkspacedata',
                // Shared scheme
                'example.xcodeproj/xcshareddata/xcschemes/example.xcscheme',
            ];
            assert.file(files);
            noFilesContent(files, pattern);
        });

        it('creates Framework target', function () {

            // Framework target
            var files = [
                'example/Info.plist',
                'example/example.h',
                'example/example.swift',
            ];
            assert.file(files);
            noFilesContent(files, pattern);
        });

        it('creates UnitTests target', function () {

            // UnitTests target
            var files = [
                'UnitTests/Info.plist',
                'UnitTests/UnitTests.swift',
            ];
            assert.file(files);
            noFilesContent(files, pattern);

        });

        it('creates files', function () {
            assert.file(['.travis.yml', 'LICENSE', ]);
        });

        it('creates podsepc', function () {
            assert.file('example.podspec');
            // repo url
            assert.fileContent('example.podspec', 'https://github.com/gu/example.git');
            assert.noFileContent('example.podspec', pattern);
        });

        it('creates Cartfile', function () {
            assert.file('Cartfile.private');
            assert.file('Cartfile.resolved');
        });
    });
});
