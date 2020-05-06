## Serverless 설치하고 설정하기

```shell script

npm install -g serverless

sls --version

```

## AWS Role

```shell script

serverless config credentials --provider aws --key {액세스 키 ID} --secret {비밀 액세스 키}

```
## Node.js init

```shell script
npm init
```

## install dependency

```shell script

npm i chrome-aws-lambda
npm i puppeteer

```

## Serverless Framework

```shell script

sls create -t aws-nodej

```

## Local Test 

```shell script

sls invoke local --function macro
sls invoke local --function macro --stage prod

```

## Deploy

```shell script

sls deploy --stage prod

```




