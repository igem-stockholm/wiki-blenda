var request = require('request-promise')
var htmlparser = require('htmlparser2')
var walk = require('walk')
var fs = require('fs')

request = request.defaults({jar: true, followAllRedirects: true})

const user = process.env.IGEM_USER
const password = process.env.IGEM_PASSWORD
const loginBase = 'https://igem.org/Login2'
const ghostBase = process.env.GHOST_LOCATION
const assetsBase = ghostBase + '/themes/wiki-2016/assets/'
const contentBase = ghostBase + '/'
const fileNameBase = 'T--Stockholm--'
const fileBase = 'http://2016.igem.org/File:T--Stockholm--'
const uploadUrl = 'http://2016.igem.org/Special:Upload'

console.log('Logging in...')
request.post(loginBase).form({username: user, password: password, Login: 'Login', return_to: ''}).then((body) => {
  // console.log(body)
  console.log('success')
  return processEverything()
}).catch((error) => {
  console.error(error)
})

const processEverything = function () {
  var walker = walk.walk(ghostBase, { followLinks: false, filters: ['.DS_Store'] })
  walker.on('file', function (root, fileStats, next) {
    uploadImage(root, fileStats.name).then(() => {
      next()
    })
  })

  walker.on('end', function () {
    console.log('all done')
  })
}

const newFileName = function (folder, filename) {
  var parts = folder.replace(ghostBase + '/images/', '').split('/')
  return fileNameBase + parts.join('-') + '-' + filename
}

var getToken = function () {
  return new Promise((resolve, reject) => {
    var parser = new htmlparser.Parser({
      onopentag: function (name, attribs) {
        if (name === 'input' && attribs.id === 'wpEditToken') {
          resolve(attribs.value)
        }
      }
    }, {decodeEntities: true})

    request.get(uploadUrl).then((html) => {
      parser.write(html)
      parser.end()
    })
  })
}

var uploadImage = function (root, filename) {
  return getToken().then((token) => {
    uploadImageToWiki(root, filename, token)
  })
}

var uploadImageToWiki = function (root, filename, token) {
  var formData = {
    // Pass a simple key-value pair
    wpDestFile: newFileName(root, filename),
    wpUploadDescription: '',
    wpLicense: '',
    wpWatchthis: '0',
    wpUpload: 'Upload file',
    title: 'Special:Upload',
    // Pass data via Streams
    wpUploadFile: fs.createReadStream(root + '/' + filename),
    wpEditToken: token
  }

  request.post({url: uploadUrl, formData: formData}, function optionalCallback (err, httpResponse, body) {
    if (err) {
      return console.error('upload failed:', err)
    }
    console.log('Upload successful: ' + newFileName(root, filename))
  })
}
