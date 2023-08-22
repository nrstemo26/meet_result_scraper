//adding Puppeteer library
const pt = require('puppeteer');


//this lets us see the actual work in a browser
//adding headless flag to false
pt.launch({headless:false}).then(async browser => {
   //browser new page
   const p = await browser.newPage();
   //set viewpoint of browser page
   await p.setViewport({ width: 1000, height: 500 })
   //launch URL
   
   await p.goto('https://www.tutorialspoint.com/about/about_careers.htm');
   
   console.log(await p.content())

})