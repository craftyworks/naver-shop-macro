const chromium = require('chrome-aws-lambda');
const naver = require('./naver')

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
        }
      }
    }
  } catch (err) {
    console.log(err)
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
