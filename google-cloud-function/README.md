
## Reference

* https://cloud.google.com/functions/docs/first-nodejs?hl=ko

## Cloud SDK 설치

* https://cloud.google.com/sdk/docs?hl=ko

PowerShell 에서 아래 스크립트 실행

```shell script
    (New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe") & $env:Temp\GoogleCloudSDKInstaller.exe
```

## 초기화

```shell script

gcloud init

gcloud components update

```

## Deploy

```shell script

gcloud functions deploy macro --runtime nodejs8 --trigger-http --set-env-vars naver_id=네이버ID,naver_password=패스워드 --timeout=300s --memory=1024MB --region=asia-northeast1

gcloud functions deploy macro --runtime nodejs8 --trigger-http --set-env-vars naver_id=ddam40,naver_password=ddam114e! --timeout=300s --memory=1024MB --region=asia-northeast1

```

