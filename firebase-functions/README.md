## firebase-cli 설치

```node

npm install -g firebase-tools

```
## firebase login

```node

firebase login

```

## 초기화

```shell

firebase init functions

```

## 환경변수 설정
```
firebase functions:config:set naver.id="아이디" naver.password="패스워드"

firebase functions:config:get

```

## 테스트

```shell script

firebase serve

```

## Deploy

```shell script

firebase deploy

```

## Macro

> Error: net::ERR_NAME_RESOLUTION_FAILED at https://www.naver.com

돈을 안내면 `Firebase` 에서는 Outbound 요청을 사용할 수 없다.
