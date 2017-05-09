# Gennifer
## A basic template generator

### Quick Start

To run, simply;

```
> cd gennifer;
> index.js
```

### Options
```
usage: gennifer <type> <name>
  -h --help     Display the help
  -p --prefix   Set the prefix of your generated code
  -d --dry      Do not generate any files or change any files, but show the outputs

Types:
  component, c    Generate a new component
  service, s      Generate a new service
```

### Examples
```
> index.js -d -p ys c SomeComponent
[dry run] Writing file /src/assets/components/ysSomeComponent/ysSomeComponent.component.js
[dry run] Writing file /src/assets/components/ysSomeComponent/ysSomeComponent.component.html
[dry run] Writing file /src/assets/components/ysSomeComponent/ysSomeComponent.component.css.less
[dry run] Writing file /src/assets/components/ysSomeComponent/index.js
[dry run] Writing file /src/assets/components/ysSomeComponent/index.css.less
[dry run] Writing file /src/assets/components/index.js
[dry run] Writing file /src/assets/components/index.css.less
```

### Type Checking
To run type checking to validate the code,

```
> tsc
```
