# rovsquad18
Repository for the 2018 ROV project through WIT IEEE

## How to run
The following steps will start the robot in debug mode<br>
```bash
cd production
npm install
npm run bootstrap
npm run deploy -- --local --startSurface
```
The robot will be listening on `localhost:8080` with dummy sensors, and the dashboard on `localhost:80`

## Run you some tests!
make sure you've bootstrapped first
```bash
npm run test
```
