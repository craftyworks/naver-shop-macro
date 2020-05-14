const puppeteer = require('puppeteer');
const fs = require('fs')
const userId = process.env.naver_id
const password = process.env.naver_password
const product = process.env.naver_prod
console.log(`[${userId}], [${product}]`)

/** 금아마스크WHITE */
const product1 = 'https://smartstore.naver.com/kumaelectron/products/4922095600'
/** 금아덴탈마스크 */
const product2 = 'https://smartstore.naver.com/kumaelectron/products/4754238400'
/** 금아 블랙마스크 */
const product3 = 'https://smartstore.naver.com/kumaelectron/products/4813999869'
const test_product = 'https://smartstore.naver.com/kumaelectron/products/4836415470'

const browserOptions = {
  headless: false,
  devtools: false,
  defaultViewport: {width: 1900, height: 900},
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ],
  ignoreDefaultArgs: ['--disable-extensions']
}

const getTime = () => new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, '')

const saveScreenshot = async (page, fileName) => {
  await page.screenshot({path: `${fileName}.png`, fullPage: true});

  const html = await page.content()
  await fs.writeFile(`${fileName}.html`, html, (err) => {
  })

  const url = await page.url()
  await fs.writeFile(`${fileName}.text`, url, (err) => {
  })

  console.log('saveScreenshot', fileName)
}

/** 네이버 로그인 */
const naverLogin = async (page) => {
  try {
    await page.goto('https://www.naver.com')
    await page.waitFor(10000)

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
  // 일반결제
  await page.waitForSelector('#basic').then(() => {
  })
  await page.waitFor(500)
  await page.click('#basic')

  await page.evaluate(() => {
    document.querySelectorAll('button.button_notview').forEach(el => el.click())
  })

  // 나중에결제
  await page.click('a._payMethod._SKIP')

  await page.waitForSelector('span > label[for=all_agree_btn]').then(() => {
  })
  // 전체 동의하기
  await page.evaluate(() => {
    document.querySelector('span > label[for=all_agree_btn]').click()
  })

  // 주문하기
  await page.click('a._doPayButton')
  await page.waitForNavigation({waitUntil: 'networkidle0'})

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

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    while (true) {
      await Promise.all([
        // Move Product Page
        page.goto(product),
        page.waitForNavigation({waitUntil: 'networkidle0'})
      ])
      await buyProduct(page)
      await page.waitFor(1000)
    }

    await page.waitFor(30000)
    await saveScreenshot(page, getTime() + '_error')
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
