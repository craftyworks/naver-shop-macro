const puppeteer = require('puppeteer');
const fs = require('fs')
const userId = process.env.naver_id
const password = process.env.naver_password
console.log(`[${userId}], [${password}]`)

/** 금아마스크WHITE */
const product = 'https://smartstore.naver.com/kumaelectron/products/4922095600'
/** 금아덴탈마스크 */
const product2 = 'https://smartstore.naver.com/kumaelectron/products/4754238400'
/** 금아 블랙마스크 */
const product3 = 'https://smartstore.naver.com/kumaelectron/products/4813999869'
const test_product = 'https://smartstore.naver.com/kumaelectron/products/4836415470'

const browserOptions = {
  headless: true,
  devtools: false,
  defaultViewport: {width: 1900, height: 900},
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ],
  ignoreDefaultArgs: ['--disable-extensions']
}

const getTime = () => new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, '')

const saveScreenshot = async(page, fileName) => {
  await page.screenshot({path: `${fileName}.png`, fullPage: true});

  const html = await page.content()
  await fs.writeFile(`${fileName}.html`, html, (err) => {})

  console.log('saveScreenshot', fileName)
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
    browser = await puppeteer.launch(browserOptions)
    page = await browser.newPage()
    // Login
    if (!await naverLogin(page)) {
      return
    }

    let success = false
    while (!success) {
      // Move Product Page
      await page.goto(product)
      if (await page.$('div.not_goods')) {
        console.log('sold out!')
      } else {
        if (await page.$('div.module_error')) {
          console.log('error page')
          await page.waitFor(30000)
          await page.goto(product)
        } else {
          console.log('for sale')
          success = await buyProduct(page)
          await saveScreenshot(page, `${getTime()}_${result}`)
        }
      }
    }
  } catch (err) {
    console.error(err)
    await saveScreenshot(page, getTime() + '_error')
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
