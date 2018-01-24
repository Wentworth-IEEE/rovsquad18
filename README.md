# rovsquad18
Welcome to the repository for WIT IEEE's 2018 MATE Explorer Class Underwater ROV! 

## How to run
The following steps will start the robot in debug mode<br>
```bash
cd js
npm install
npm run bootstrap
npm run deploy -- --debug --startSurface
```
The robot will be listening on `localhost:8080` with dummy sensors, and the dashboard on `localhost:80`

## Run you some tests!
make sure you've bootstrapped first
```bash
npm run test
```
