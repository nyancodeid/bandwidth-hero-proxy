# Bandwidth Hero (Refactored)

[![Repository](https://img.shields.io/badge/github-bandwidth--hero--proxy-green?logo=github&style=flat)](https://github.com/nyancodeid/bandwidth-hero-proxy)
![License MIT](https://img.shields.io/github/license/nyancodeid/bandwidth-hero-proxy)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Version](https://img.shields.io/badge/version-v2.3.0-brightgreen)
[![Issues](https://img.shields.io/github/issues/nyancodeid/bandwidth-hero-proxy)](https://github.com/nyancodeid/bandwidth-hero-proxy/issues)
![Project CI](https://github.com/nyancodeid/bandwidth-hero-proxy/workflows/Project%20CI/badge.svg)

Bandwidth Hero is an open-source browser extension which reduces the amount of data consumed when
you browse web pages by compressing all images on the page. It uses
[data compression service](https://github.com/ayastreb/bandwidth-hero-proxy) to convert images to
low-resolution [WebP](https://developers.google.com/speed/webp/) or JPEG images.

## How It Works?

![Workflow](https://raw.githubusercontent.com/ayastreb/bandwidth-hero/master/how-it-works.png)

1. When active, Bandwidth Hero intercepts all images loading requests
2. It sends each image URL to the data compression service
3. Compression service downloads the original image
4. Once image is downloaded it is then converted to low-resolution
   [WebP](https://developers.google.com/speed/webp/)/JPEG image.
5. Compression service returns processed image to the browser

## Privacy Consideration

After installing the extension you need to setup data compression service.

Please refer to [data compression service docs](https://github.com/nyancodeid/bandwidth-hero-proxy)
for detailed instructions on how to run your own service.

Once you have your own instance running, click "Configure data compression service" button under
"Compression settings" in the extension popup.

## Installation
First, make sure you have installed the Bandwidth hero extension in your browser of choice. If not, you can install it via the link below:

[![Get Chrome Web Extension](https://cloudflare-ipfs.com/ipfs/bafkreih36ke7zkef4wfbkb6mrru2tx3i6npihzudqjntvvwnmf5quf6xtq)](https://chrome.google.com/webstore/detail/bandwidth-hero/mmhippoadkhcflebgghophicgldbahdb?hl=en-US)

[![Get Firefox Addon](https://cloudflare-ipfs.com/ipfs/bafkreib7acf3fqog6ta2yrponpufbmmk3h5jlqfrmlaw3y325bkhd5tj7i)](https://addons.mozilla.org/en-US/firefox/addon/bandwidth-hero/)

Next, for setting the Data Compression Service you can enter the url of this nodejs app. For example, if this apps is running on `localhost` with port `3000` then you enter the url

`http://localhost:3000/s/:username/:token`

Make sure you have created a user to get the access token. Or you can use the demo account below.

## Demo Account
Default account for production database (database.prod.sqlite3):

- username : demo
- email : demo@gmail.com
- password : demo
- token : `67cb14`

## Authors

- [ayastreb](https://github.com/ayastreb) (c) 2016 (Original) - [ayastreb/bandwidth-hero-proxy](https://github.com/ayastreb/bandwidth-hero-proxy)
- [nyancodeid](https://github.com/nyancodeid) (c) 2020-2021 - [nyancodeid/bandwidth-hero-proxy](https://github.com/nyancodeid/bandwidth-hero-proxy)
