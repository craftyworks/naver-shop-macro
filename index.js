const puppeteer = require('puppeteer');
const userId = process.env.USER_ID
const password = process.env.PASSWORD
/** 금아 블랙마스크 */
const product = 'https://smartstore.naver.com/kumaelectron/products/4813999869'
const test_product = 'https://smartstore.naver.com/kumaelectron/products/4836415470'

if (!process.env.STAGE) process.env.STAGE = 'local'

const getChromeBrowserArgument = async () => {
  let puppeteerArgument = null
  if (process.env.STAGE === 'local') {
    puppeteerArgument = {
      headless: true,
      devtools: false,
      defaultViewport: {width: 1900, height: 900},
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  } else {
    puppeteerArgument = {
      // args: chromium.args,
      // executablePath: await chromium.executablePath,
      // headless: chromium.headless
    }
  }
  return puppeteerArgument
}
/** 네이버 로그인 */
const naverLogin = async (page) => {
  try {
    await page.goto('https://www.naver.com')
    await page.click('#account > a.link_login')

    // await page.type('#id', userId)
    // await page.type('#pw', password)
    /* 네이버 CAPTCHA 무력화 */
    await page.evaluate((id, pw) => {
      document.querySelector('#id').value = id;
      document.querySelector('#pw').value = pw;
    }, userId, password)

    await Promise.all([
      page.click('#log\\.login'),
      page.waitForNavigation({waitUntil: 'networkidle2'})
    ])

    // Check Login Success
    /*
    const elementHandle = await page.$('iframe#minime');
    const frame = await elementHandle.contentFrame();
    await frame.waitForSelector('div.email');
    const email = await frame.$eval('div.email', el => el.textContent);
    console.log('Naver Login Suceess, %s', email)
     */
    console.log('Naver Login Success')
  } catch (err) {
    console.error(err)
  }
}

/** 상품 결제 */
const buyProduct = async (page) => {
  await Promise.all([
    page.click('span.buy > a'),
    page.waitForNavigation({waitUntil: 'networkidle0'})
  ])
  // 일반결제
  await page.waitForSelector('#generalPayments').then(() => {
  })
  await page.click('#generalPayments')
  await page.waitForSelector('#pay1', {visible: true, timeout: 2000}).then(() => {
  })
  // 실시간계좌이체
  await page.click('#pay1')
  // 나중에결제
  await page.click('#pay18')
  // 전체 동의하기
  await page.click('#allAgree')
  await page.click('button.btn_payment')
  await page.waitForNavigation({waitUntil: 'networkidle0'})

  if (await page.$('.order_number')) {
    const orderNo = await page.$eval('.order_number', el => el.textContent);
    console.log('Order No : %s', orderNo)
    return true
  }
  return false
}

(async () => {
  let browser = null
  let page = null
  try {
    browser = await puppeteer.launch(await getChromeBrowserArgument())
    page = await browser.newPage()
    // Login
    await naverLogin(page)

    let success = false
    while (!success) {
      // Move Product Page
      await page.goto(product)
      if (await page.$('div.not_goods')) {
        console.log('sold out!')
      } else {
        console.log('for sale')
        success = await buyProduct(page)
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    if (page != null) {
      for (let page of await browser.pages()) {
        await page.close({
          'runBeforeUnload': true
        })
      }
      await browser.disconnect()
      browser.close()
    }
  }
})()
