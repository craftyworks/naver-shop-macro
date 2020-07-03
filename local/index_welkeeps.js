const puppeteer = require('puppeteer');
const fs = require('fs')
const userId = process.env.naver_id
const password = process.env.naver_password
const product = process.env.naver_prod
console.log(`[${userId}], [${product}]`)

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

const saveScreenshot = async(page, fileName) => {
  await page.screenshot({path: `${fileName}.png`, fullPage: true});

  const html = await page.content()
  await fs.writeFile(`${fileName}.html`, html, (err) => {})

  const url = await page.url()
  await fs.writeFile(`${fileName}.text`, url, (err) => {})

  console.log('saveScreenshot', fileName)
}

/** 네이버 로그인 */
const naverLogin = async (page) => {
  try {
    await page.goto('https://www.naver.com')
    await page.click('#account > a.link_login')
	await page.waitFor(500)
	
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
    page.waitForNavigation(),
    page.click('span.buy > a'),
    page.waitForNavigation({waitUntil: 'networkidle0'})
  ])

    page.on('dialog', async dialog => {
      await dialog.accept();
    });
	
  // 일반결제
  await page.waitForSelector('#generalPayments').then(() => { })
  await page.waitFor(500)
  await page.click('#generalPayments')

  await page.evaluate(() => {
    document.querySelectorAll('button.button_notview').forEach(el => el.click())
  })

  // 실시간계좌이체
  // 나중에결제
  // 전체 동의하기
  await page.waitForSelector('#pay1').then(() => { })
  await page.evaluate(() => {
    document.querySelector('#pay1').click()
    document.querySelector('#pay18').click()
    document.querySelector('label[for=all_agree]').click()
  })

  // 구매하기
  await page.click('button.btn_payment')

  await page.waitForNavigation({waitUntil: 'networkidle0'})

  if (await page.$('.order_number')) {
    const orderNo = await page.$eval('.order_number', el => el.textContent);
    console.log('Order No : %s', orderNo)
    return true
  }

  const url = await page.url()
  await fs.writeFile(`${getTime()}_url.text`, url, (err) => {})

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
        console.log(`${new Date().toLocaleTimeString()} sold out!`)
      } else {
        if (await page.$('div.module_error')) {
          console.log('error page')
          await page.waitFor(1000 * 60 * 5)
          await page.goto(product)
        } else {
          console.log('for sale')

	  // 구매수량 10개
      const prodCnt = await page.$('#cuid_0');
      await prodCnt.click({ clickCount: 3 })
      await prodCnt.type("10");
	  
          success = await buyProduct(page)
          await saveScreenshot(page, `${getTime()}_${success}`)
        }
      }
      // thinking time (평일 8시 50분 ~ 9시 10분 공략)
      let thinkTime = 5 * 60 * 1000 /* 5 minutes */
      let day = new Date().getDay()
      let hh = new Date().getHours()
      const mm = new Date().getMinutes()
      if( day > 0 && day < 6) {
        if((hh === 8 && mm >= 50) || (hh === 9 && mm <= 10)) {
          thinkTime = 1000
        }
      }
      console.log('thinkTime : ', thinkTime)
      await page.waitFor(thinkTime)
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
