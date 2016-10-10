var request = require('request-promise')
request = request.defaults({jar: true, followAllRedirects: true})

const user = process.env.IGEM_USER
const password = process.env.IGEM_PASSWORD
const loginBase = 'https://igem.org/Login2'
const ghostBase = process.env.GHOST_LOCATION
const assetsBase = ghostBase + '/themes/wiki-2016/assets/'
const contentBase = ghostBase + '/'
const fileBase = 'http://2016.igem.org/File:T--Stockholm--'

var walk = require('walk')
var fs = require('fs')
var path = require('path')
var walker = walk.walk(ghostBase, { followLinks: false })

walker.on('file', fileHandler)
walker.on('errors', errorsHandler)
walker.on('end', endHandler)

function fileHandler (root, fileStat, next) {
  fs.readFile(path.resolve(root, fileStat.name), function (buffer) {
    console.log(fileStat.name, buffer.byteLength)
    next()
  })
}

function errorsHandler (root, nodeStatsArray, next) {
  nodeStatsArray.forEach(function (n) {
    console.error('[ERROR] ' + n.name)
    console.error(n.error.message || (n.error.code + ': ' + n.error.path))
  })
  next()
}

function endHandler () {
  console.log('all done')
}
//
// request.post(loginBase).form({username: user, password: password, Login: 'Login', return_to: ''}).then((body) => {
//   console.log(body)
//   processEverything()
// }).catch((error) => {
//   console.error(error)
// })
//
// const processEverything = function () {
//   const pages = {
//     '/team': '/Team'
//   }
//
//   for (const page in pages) {
//     getGhost(page).then((newContent) => {
//       console.log(newContent)
//     })
//   }
// }
//
// var getGhost = function (page) {
//   return request.get(ghostBase + page).then((body) => {
//     return Promise.resolve(body)
//   })
// }
