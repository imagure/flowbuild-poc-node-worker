# Flowbuild Node Worker
![Coverage lines](./coverage/badge-lines.svg)
![Coverage branches](./coverage/badge-branches.svg)
![Coverage functions](./coverage/badge-functions.svg)
![Coverage statements](./coverage/badge-statements.svg)

Node Worker in TS.

Importing ```@flowbuild/engine``` nodes.

Obs.: ```@flowbuild/engine``` doesn't contain types. This is yet to be addressed.

## Run on your localhost:
* Setup:
```
pnpm i
pnpm run prepare
```
* Running:
```
pnpm run start:dev    # will run ts-node
```
or
```
pnpm run build
pnpm run start
```
## Running tests:
* Test scripts
```
pnpm run test
pnpm run test:cov
pnpm run test:badges
```

## App monitoring:
To get application behavior, you might use climem (reference: https://www.npmjs.com/package/climem)

It's a quick setup:
```
pnpm i climem -D
export CLIMEM=8997 && ts-node -r climem -r tsconfig-paths/register ./src/index.ts
```

To see memory usage:
```
climem 8997 localhost
```