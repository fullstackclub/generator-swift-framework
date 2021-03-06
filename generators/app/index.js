'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var resolvePath = function (string) {
    if (string.substr(0, 1) === '~') {
        string = process.env.HOME + string.substr(1)
    }
    return path.resolve(string)
};

module.exports = yeoman.generators.Base.extend({
    constructor: function () {
        yeoman.generators.Base.apply(this, arguments);

        // This method adds support for a `--skip-install` flag
        this.option('skip-install', {
            desc: 'Do not install Carthage deps',
        });
    },

    prompting: {
        askFor: function () {
            var done = this.async();

            // Have Yeoman greet the user.
            this.log(yosay('Welcome to the outstanding ' + chalk.red('swift.framework') + ' generator!'));

            var prompts = [{
                type: 'input',
                name: 'projectName',
                message: 'Project Name',
                default: 'MyProject'
            }, {
                type: 'input',
                name: 'organizationName',
                message: 'Organization Name',
                default: 'MyOrg',
                store: true
            }, {
                type: 'input',
                name: 'organizationId',
                message: 'Organization Identifier',
                default: 'org.my',
                store: true
            }];

            this.prompt(prompts, function (props) {
                this.projectName = props.projectName;
                this.organizationName = props.organizationName;
                this.organizationId = props.organizationId;

                this.props = props;

                done();
            }.bind(this));
        },

        askForCocoaPods: function () {
            var done = this.async();

            var prompts = [{
                type: 'confirm',
                name: 'cocoapods',
                message: 'Would you like to distribute via CocoaPods?',
                default: true
            }];

            this.prompt(prompts, function (props) {
                this.cocoapods = props.cocoapods;
                done();
            }.bind(this));
        },

        askForGitHub: function () {
            var done = this.async();

            var prompts = [{
                type: 'input',
                name: 'githubUser',
                message: 'Would you mind telling me your username on GitHub?',
                store: true,
            }];

            this.prompt(prompts, function (props) {
                this.githubUser = props.githubUser;
                this.props = _.extend(this.props, props);
                done();
            }.bind(this));
        },

        askForTravis: function () {
            var done = this.async();

            var prompts = [{
                type: 'confirm',
                name: 'travis',
                message: 'Would you like to enable Travis CI?',
                default: true,
            }];

            this.prompt(prompts, function (props) {
                this.travis = props.travis;
                done();
            }.bind(this));
        },

        askForGitLab: function () {
          var done = this.async();

          var prompts = [{
            type: 'confirm',
            name: 'gitlab',
            message: 'Would you like to enable GitLab CI?',
            default: true,
          }];

          this.prompt(prompts, function (props) {
            this.gitlab = props.gitlab;
            done();
          }.bind(this));
        },

        askForCertPath: function () {
            var done = this.async();
            var travis = this.travis;

            var prompts = [{
                type: 'input',
                name: 'certPath',
                message: 'Development Certificate Path',
                default: 'path/to/development.p12',
                store: true,
                when: function () {
                    return travis;
                }
            }, {
                type: 'confirm',
                name: 'askCertPathAgain',
                message: 'The certificate you provide does not exist, specify again?',
                default: true,
                when: function (answers) {
                    var done = this.async();

                    if (!travis) {
                        done(false);
                        return;
                    }

                    answers.certPath = resolvePath(answers.certPath);
                    fs.stat(answers.certPath, function (err, stats) {
                        if (err || !stats.isFile()) {
                            answers.certPath = null;
                        }
                        done(answers.certPath === null);
                    });
                }
            }];

            this.prompt(prompts, function (props) {
                if (props.askCertPathAgain) {
                    return this.prompting.askForCertPath.call(this);
                }

                this.certPath = props.certPath;
                done();
            }.bind(this));
        },
    },

    writing: {
        xcode: function () {
            var files = [
                // The list is generated by `find . -type f -exec echo \'{}\', \;`
                'Example/AppDelegate.swift',
                'Example/Assets.xcassets/AppIcon.appiconset/Contents.json',
                'Example/Base.lproj/LaunchScreen.storyboard',
                'Example/Base.lproj/Main.storyboard',
                'Example/Info.plist',
                'Example/ViewController.swift',
                'PROJECT_NAME/Info.plist',
                'PROJECT_NAME/PROJECT_NAME.h',
                'PROJECT_NAME/PROJECT_NAME.swift',
                'PROJECT_NAME.xcodeproj/project.pbxproj',
                'PROJECT_NAME.xcodeproj/project.xcworkspace/contents.xcworkspacedata',
                'PROJECT_NAME.xcodeproj/xcshareddata/xcschemes/PROJECT_NAME.xcscheme',
                'UnitTests/Info.plist',
                'UnitTests/UnitTests.swift',
                'Makefile',
                'CONTRIBUTING.md',
                'README.md',
            ];

            files.forEach(function (entry) {
                var source = entry.replace(/PROJECT_NAME/g, this.projectName);
                this.fs.copyTpl(this.templatePath(entry), this.destinationPath(source), this.props);
            }.bind(this));
        },

        license: function () {
            this.fs.copyTpl(this.templatePath('LICENSE'), this.destinationPath('LICENSE'), this.props);
        },

        projectFiles: function () {
            var files = [
                'script/cert',
                'script/README.md',
                'Cartfile.private',
                'Cartfile.resolved',
                'Gemfile',
                'Gemfile.lock',
            ];
            files.forEach(function (entry) {
                this.fs.copy(this.templatePath(entry), this.destinationPath(entry));
            }.bind(this));
        },

        gitignore: function () {
            // Cannot use .gitignore in Template Project, See https://github.com/cybertk/generator-swift-framework/issues/6
            this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'));
        },

        travis: function () {
            if (!this.travis) {
                return;
            }
            this.fs.copy(this.templatePath('.travis.yml'), this.destinationPath('.travis.yml'));
            if (this.certPath) {
                this.fs.copy(this.certPath, this.destinationPath('script/certificates/development.p12'));
            }
        },

        gitlab: function () {
          if (!this.gitlab) {
              return;
          }
          var files = [
            '.gitlab-ci.yml',
            'script/cibuild',
          ];
          files.forEach(function (entry) {
            this.fs.copy(this.templatePath(entry), this.destinationPath(entry));
          }.bind(this));
        },

        cocoapods: function () {
            if (!this.cocoapods) {
                return;
            }
            var podspec = this.destinationPath(this.projectName + '.podspec');
            this.fs.copyTpl(this.templatePath('PROJECT_NAME.podspec'), podspec, this.props);
        },
    },

    install: {
        carthageBootstrap: function () {
            if (this.options.skipInstall) {
                this.log('Please run `carthage bootstrap`');
                return;
            }

            var done = this.async();

            this.log('Carthage bootstraping');
            var child = this.spawnCommand('make', ['bootstrap', 'deps']);
            child.on('exit', done);
        },

        openXcode: function () {
            if (this.options.openXcode !== false) {
                this.spawnCommand('open', [this.destinationPath(this.projectName + '.xcodeproj')]);
            }
        },
    }
});
