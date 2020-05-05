## Serverless 설치하고 설정하기

```shell script

npm install -g serverless

sls --version

```

## AWS Role

```shell script

serverless config credentials --provider aws --key {액세스 키 ID} --secret {비밀 액세스 키}

```

## Local Test 

```shell script

sls invoke local --function macro

```

## Deploy

```shell script

sls deploy

```




