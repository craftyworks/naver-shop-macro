const chromium = require('chrome-aws-lambda');
const naver = require('./naver')
const S3Client = require("aws-sdk/clients/s3");

const browserOptions = async () => {
  console.log('stage: ', process.env.stage)
  if (process.env.stage === 'prod') {
    return {
      executablePath: await chromium.executablePath,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
    }
  } else {
    return {
      headless: false,
      defaultViewport: {width: 1900, height: 900},
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  }
}

const getTime = () => new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, '')

/**
 * 현재 스크린샷을 저장하여 S3 Bucket 에 업로드
 */
const saveScreenshot = async(page, fileName) => {
  const {s3_region, s3_bucket} = process.env
  const s3 = new S3Client({ region: s3_region });
  const buffer = await page.screenshot()
  let result = await s3.upload({
    Bucket: s3_bucket,
    Key: `${fileName}.png`,
    Body: buffer,
    ContentType: 'image/png',
  }).promise()
  console.log('upload screenshot ', result.Bucket, result.Key)

  const html = await page.content();
  result = await s3.upload({
    Bucket: s3_bucket,
    Key: `${fileName}.html`,
    Body: html,
    ContentType: 'text/html',
  }).promise()
  console.log('upload html ', result.Bucket, result.Key)

  const url = await page.url()
  result = await s3.upload({
    Bucket: s3_bucket,
    Key: `${fileName}.text`,
    Body: url,
    ContentType: 'text/plain',
  }).promise()
  console.log('upload url', result.Bucket, result.Key)
}

/**
 * 메인 람다 펑션
 */
module.exports.macro = async (event, context, callback) => {
  const {naver_id, naver_password} = process.env

  let browser = null
  let page = null
  let error = null
  let success = false
  try {
    browser = await chromium.puppeteer.launch(await browserOptions())
    page = await browser.newPage()
    // Login
    if (await naver.login(page, naver_id, naver_password)) {
      let count = Number(event.count) || 100
      while (!success && count-- > 0) {
        // Move Product Page
        await page.goto(naver.product)
        if (await page.$('div.not_goods')) {
          console.log('%d sold out!', count)
        } else {
          console.log('%d for sale', count)
          success = await naver.buyProduct(page)
          await saveScreenshot(page, `${getTime()}_${success}`)
        }
      }
    }
  } catch (err) {
    console.log(err)
    await saveScreenshot(page, `${getTime()}_error`)
    error = err
  } finally {
    if (page !== null) {
      for (let page of await browser.pages()) {
        await page.close({
          'runBeforeUnload': true
        })
      }
      await browser.disconnect()
      await browser.close()
    }
  }
  callback(error, {success})
}
