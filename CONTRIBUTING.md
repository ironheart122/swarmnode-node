# Setting up the development environment

First off, thanks for taking the time to contribute! 🔥

## Install dependencies and build the package

```bash
export SWARMNODE_API_KEY=your_api_key # Get your API key from https://app.swarmnode.ai/settings/api-keys/

pnpm install
pnpm build
```

This will install all the required deps and build output files to `dist/`.

In your local project, you can install the package from the local path:

```bash
pnpm install [PATH_TO_LOCAL_PACKAGE] # eg. Make sure the path points to the root of the package)
```

Happy Devving!

## Running tests

Make sure to have a valid API key set in your environment.

```bash
pnpm test
```

## Adding and running examples

All files in the `examples/` directory can be freely edited or added to.
