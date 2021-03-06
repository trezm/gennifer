#!/usr/bin/env node

const ejs = require('ejs');
const path = require('path');
const fs = require('node-fs-extra');

start(process.argv);

/**
 * @typedef {Object} Options
 * @property {boolean} dryRun
 * @property {string} prefix
 */

/**
 * @param {Array.<string>} args
 */
function start(args) {
  /** @type {string} */
  let name;

  /** @type {string} */
  let type;

  /** @type {Options} */
  let options = {
    dryRun: false,
    prefix: ''
  };

  for (let i = 2; i < args.length; i++) {
    const currentArg = args[i];

    if (currentArg === '-h' || currentArg === '--help') { displayHelp(); }
    else if (currentArg === '-d' || currentArg === '--dry') { options.dryRun = true; }
    else if (currentArg === '-p' || currentArg === '--prefix') { options.prefix = args[++i]; }
    else if (!type) { type = currentArg; }
    else if (!name) { name = currentArg; }
    else { break; }
  }

  if (type === 'component' || type === 'c') { compileComponent(name, options); }
  else if (type === 'service' || type === 's') { compileService(name, options); }
  else if (type === 'noangular' || type === 'n') { compileNoAngularPage(name, options); }
}

/**
 * @param {string} name
 * @param {Options} options
 */
function compileNoAngularPage(name, options) {
  if (options.prefix) {
    name = options.prefix + name[0].toUpperCase() + name.slice(1);
  }

  const className = name[0].toUpperCase() + name.slice(1);
  const instanceName = name[0].toLowerCase() + name.slice(1);
  const snakeCaseName = instanceName.replace(/([A-Z])/g, (group1) => `-${group1.toLowerCase()}`);

  if (!options.dryRun) {
    fs.mkdirSync(`./src/views/${instanceName}`);
    fs.mkdirSync(`./src/assets/${instanceName}`);
    fs.copySync(`${__dirname}/assets/icons`, `./src/views/${instanceName}/icons`);
  }

  Promise.resolve()
    // .then(() => compileTemplate('component.js', { className: className.replace(options.prefix, ''), instanceName: instanceName }))
    // .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/components/${instanceName}/${instanceName}.component.js`), compiledTemplate, options))
    .then(() => compileTemplate('raw-page.ejs', { snakeCaseName: snakeCaseName, instanceName: instanceName }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/views/${instanceName}/index.ejs`), compiledTemplate, options))
    .then(() => compileTemplate('raw-header.ejs', { instanceName: instanceName }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/views/${instanceName}/_${instanceName}Header.ejs`), compiledTemplate, options))
    .then(() => compileTemplate('raw-footer.ejs', { instanceName: instanceName }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/views/${instanceName}/_${instanceName}Footer.ejs`), compiledTemplate, options))
    .then(() => compileTemplate('raw-page.css.less', { snakeCaseName: snakeCaseName }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/${instanceName}/${instanceName}-application.css.less`), compiledTemplate, options))
    .then(() => compileTemplate('raw-footer.css.less', {}))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/${instanceName}/footer.css.less`), compiledTemplate, options))
    .then(() => {
console.log(`
Success! Note, I didn't add the following, which you'll want to do in order to see the page:

1. Add a line to src/controllers/pages.js, something like:

function ${instanceName}(req, res) {
  return res.render('${instanceName}/index');
}

...

module.exports = {
  ...
  ${instanceName},
  ...
};

2. Add a route to src/routes/angular.js, something like:

/**
 * ${instanceName} page
 */
router.get('/some-magnificent-page', PagesController.${instanceName});

3. Add a pipeline to the Brocfile, something likeL:

/*
 * css (less) for ${snakeCaseName}
 */
var ${instanceName}Css = less('src/assets/${instanceName}', '${instanceName}-application.css.less', '${instanceName}-application.css', {
  paths: ['src/assets/${instanceName}'],
  compress: config.compress
});
${instanceName}Css = autoprefixer(${instanceName}Css);
${instanceName}Css = funnel(${instanceName}Css, {
  destDir: 'stylesheets'
});

...

var assets = mergeTrees([
  ...
  ${instanceName}Css
  ...
]);
`);
    });
}

/**
 * @param {string} name
 * @param {Options} options
 */
function compileComponent(name, options) {
  if (options.prefix) {
    name = options.prefix + name[0].toUpperCase() + name.slice(1);
  }

  const className = name[0].toUpperCase() + name.slice(1);
  const instanceName = name[0].toLowerCase() + name.slice(1);
  const snakeCaseName = instanceName.replace(/([A-Z])/g, (group1) => `-${group1.toLowerCase()}`);

  if (!options.dryRun) {
    fs.mkdirSync(`./src/assets/components/${instanceName}`);
  }

  compileTemplate('component.js', { className: className.replace(options.prefix, ''), instanceName: instanceName })
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/components/${instanceName}/${instanceName}.component.js`), compiledTemplate, options))
    .then(() => compileTemplate('component.html', { className: className }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/components/${instanceName}/${instanceName}.component.html`), compiledTemplate, options))
    .then(() => compileTemplate('component.css.less', { snakeCaseName: snakeCaseName }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/components/${instanceName}/${instanceName}.component.css.less`), compiledTemplate, options))
    .then(() => compileTemplate('component-index.js', { instanceName: instanceName }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/components/${instanceName}/index.js`), compiledTemplate, options))
    .then(() => compileTemplate('component-index.css.less', { className: className, instanceName: instanceName }))
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/components/${instanceName}/index.css.less`), compiledTemplate, options))
    .then(() => insertAlphabetizedLine(path.resolve(`./src/assets/components/index.js`), `export { ${instanceName} } from './${instanceName}';`, options))
    .then(() => insertAlphabetizedLine(path.resolve(`./src/assets/components/index.css.less`), `@import "./${instanceName}/index.css.less";`, options));
}

/**
 * @param {string} name
 * @param {Options} options
 */
function compileService(name, options) {
  if (options.prefix) {
    name = options.prefix + name[0].toUpperCase() + name.slice(1);
  }

  const className = name[0].toUpperCase() + name.slice(1);
  const instanceName = name[0].toLowerCase() + name.slice(1);

  if (!options.dryRun) {
    fs.mkdirSync(`./src/assets/services/${instanceName}`);
  }

  compileTemplate('service.js', { className: className, instanceName: instanceName })
    .then((compiledTemplate) => writeFileWrapper(path.resolve(`./src/assets/services/${instanceName}/${instanceName}Service.js`), compiledTemplate, options))
    .then(() => insertAlphabetizedLine(path.resolve(`./src/assets/services/index.js`), `require('./${instanceName}/${instanceName}Service.js');`, options))
}

/**
 *
 * @param {string} filePath
 * @param {string} data
 * @param {Options} options
 * @returns {Promise.<undefined>}
 */
function insertAlphabetizedLine(filePath, data, options) {
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');

  lines.push(data);
  lines = lines.filter((a) => Boolean(a)).sort();

  return writeFileWrapper(filePath, lines.join('\n'), options);
}

/**
 *
 * @param {string} filePath
 * @param {string} data
 * @param {Options} options
 * @returns {Promise.<undefined>}
 */
function writeFileWrapper(filePath, data, options){
  return new Promise((resolve, reject) => {
    if (options.dryRun) {
      console.log(`[dry run] Writing file ${filePath}`)
      resolve();
    } else {
      console.log(`Writing file ${filePath}`);
      fs.writeFile(filePath, data, (err) => (err && reject(err)) || resolve());
    }
  });
}

/**
 *
 * @param {string} templateName
 * @param {any} data
 * @param {Options} [options]
 * @returns {Promise.<string>}
 */
function compileTemplate(templateName, data, options) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(`${__dirname}/templates/${templateName}.ejs`, data, {}, (err, str) => (err && reject(err)) || resolve(str));
  });
}

/**
 * @returns {void}
 */
function displayHelp() {
  console.log(`usage: gennifer <type> <name>
  -h --help     Display the help
  -p --prefix   Set the prefix of your generated code
  -d --dry      Do not generate any files or change any files, but show the outputs

  Types:
    component, c    Generate a new component
    service, s      Generate a new service
    noangular, n    Generate a no-angular page
`);
  process.exit();
}
