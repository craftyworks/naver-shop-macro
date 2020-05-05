/* eslint-disable no-await-in-loop */
const puppeteer = require('puppeteer');

const userId = process.env.naver_id
const password = process.env.naver_password
console.log(`[${userId}], [${password}]`)

/** 금아 블랙마스크 */
const product = 'https://smartstore.naver.com/kumaelectron/products/4813999869'

const runtimeOptions = {
  timeoutSeconds: 300,
  memory: '512MB'
}

const browserOptions = {
  headless: true,
  defaultViewport: {width: 1900, height: 900},
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ],
  ignoreDefaultArgs: ['--disable-extensions']
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
      page.waitForNavigation({waitUntil: 'networkidle0'})
    ])

    // Check Login Success
    const elementHandle = await page.$('iframe#minime');
    const frame = await elementHandle.contentFrame();
    await frame.waitForSelector('div.email');
    const email = await frame.$eval('div.email', el => el.textContent);
    console.log('Naver Login Suceess, %s', email)
    return true
  } catch (err) {
    console.log('Naver Login Failed!!!')
    console.log(err)
    return false
  }
}

/** 상품 결제 */
const buyProduct = async (page) => {
  await Promise.all([
    page.click('span.buy > a'),
    page.waitForNavigation({waitUntil: 'networkidle0'})
  ])
  // 일반결제
  await page.waitForSelector('#generalPayments')
  await page.click('#generalPayments')
  await page.waitForSelector('#pay1', {visible: true, timeout: 2000})
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

exports.macro = async (req, res) => {
  let browser = null
  let page = null
  try {
    browser = await puppeteer.launch(browserOptions)
    page = await browser.newPage()
    await page.waitFor(5000)
    // Login
    if (await naverLogin(page)) {
      let count = Number(req.query.count) || 100
      let success = false
      while (!success && count-- > 0) {
        // Move Product Page
        await page.goto(product)
        if (await page.$('div.not_goods')) {
          console.log('%d sold out!', count)
        } else {
          console.log('%d for sale', count)
          success = await buyProduct(page)
        }
      }
      res.status(200).send("Firebase Function Compelted!");
    } else {
      res.status(500).send("Naver login failed" + imageBuffer)
    }
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  } finally {
    if (page !== null) {
      for (let page of await browser.pages()) {
        await page.close({
          'runBeforeUnload': true
        })
      }
      console.log('finalize')
      await browser.disconnect()
      browser.close()
    }
  }
}
