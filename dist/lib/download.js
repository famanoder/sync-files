"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ssh2SftpClient = _interopRequireDefault(require("ssh2-sftp-client"));

var _fsExtra = require("fs-extra");

var _path = require("path");

var _ora = _interopRequireDefault(require("ora"));

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

let spinner;
const {
  CMDS
} = _utils.log;
const sftp = new _ssh2SftpClient.default();

const sftpClient = require('./sftp').default(sftp); // downloadDir({
//   sftpOption: testSftpOption,
//   remoteSource, 
//   localDir: 'localDir'
// }).then(res => {
//   console.log(res);
// });


function connectSftp(_x) {
  return _connectSftp.apply(this, arguments);
} // sftp.connect(testSftpOption).then(res => {
//   sftpClient.shallowDiff('abc', remoteSource)
//   .then(res => console.log(res))
//   .catch( _ => evts.emit('exit', _.message));
//   // sftp.stat(remoteSource).then(res => {
//   //   console.log(res)
//   // }).catch(e=>console.log(e.message));
// });


function _connectSftp() {
  _connectSftp = _asyncToGenerator(function* (sftpOption) {
    yield sftp.connect(sftpOption);
  });
  return _connectSftp.apply(this, arguments);
}

function downloadInfo(localpath, remotepath) {
  _utils.events.emit('info', CMDS.DOWNLOAD, `${(0, _utils.calcText)(remotepath)} to ${(0, _utils.calcText)(localpath)}`);
}

function downloadFile(_x2) {
  return _downloadFile.apply(this, arguments);
}

function _downloadFile() {
  _downloadFile = _asyncToGenerator(function* ({
    sftpOption = {},
    remoteFilepath,
    localFilepath
  }) {
    if (_utils.verbose) {
      spinner = (0, _ora.default)().start('making remote assetsMap.');
    }

    yield connectSftp(sftpOption);
    spinner.text = `downloading ${remoteFilepath}`;
    const eq = yield sftpClient.shallowDiff(localFilepath, remoteFilepath);

    if (!eq) {
      yield sftp.fastGet(remoteFilepath, localFilepath, {
        step(got, size, all) {
          spinner.text = `${parseFloat(got / all * 100).toFixed(2)}% downloading ${remoteFilepath}`;
        }

      });
      downloadInfo(localFilepath, remoteFilepath);
      spinner.clear().succeed('one file downloaded.');
    } else {
      _utils.events.emit('info', CMDS.DONE, `exists: ${localFilepath}.`);
    }

    sftp.end();
    return {
      remoteFilepath,
      localFilepath
    };
  });
  return _downloadFile.apply(this, arguments);
}

function downloadDir({
  sftpOption = {},
  remoteSource,
  localDir
}) {
  if (_utils.verbose) {
    spinner = (0, _ora.default)().start('making remote assetsMap.');
  }

  return connectSftp(sftpOption).then(() => {
    return getRemoteList(sftp, remoteSource).then(res => {
      if (res && res.length) {
        (0, _fsExtra.ensureDirSync)(localDir);
        return downloadAll(remoteSource, localDir, res);
      }
    }).catch(e => console.log(e));
  }).catch(e => console.log(e));
}

function downloadAll(remoteSource, localDir, files) {
  if (files && files.length) {
    const filesProms = files.map((file, i) => {
      const localpath = (0, _utils.normalizePath)(localDir, file.replace(remoteSource, ''));
      const dir = (0, _path.dirname)(localpath);
      if (spinner && i == 0) spinner.text = `downloading ${file}`;
      (0, _fsExtra.ensureDirSync)(dir);
      return sftp.fastGet(file, localpath, {
        step(got, size, all) {
          if (spinner) spinner.text = `${parseFloat(got / all * 100)}% downloading ${file}`;
        }

      }).then(() => {
        if (spinner) {
          spinner.clear();
        }

        downloadInfo(localpath, file);
        return Promise.resolve({
          file,
          localpath
        });
      });
    });
    return Promise.all(filesProms).then(res => {
      sftp.end();
      if (spinner) spinner.clear().succeed(`all ${files.length} files downloaded.`);
      return Promise.resolve(res);
    });
  }
}

function getRemoteList(sftp, rDir) {
  return new Promise((rs, rj) => {
    const remoteFileList = [];

    function _getRemoteList(sftp, dir) {
      sftp.list(dir).then(res => {
        if (res.length) {
          const hasMore = res.filter(item => item.type === 'd').length;

          if (hasMore) {
            res.forEach(({
              name,
              type
            }) => {
              if (type === 'd') {
                _getRemoteList(sftp, (0, _utils.normalizePath)(dir, name));
              } else if (type === '-') {
                remoteFileList.push((0, _utils.normalizePath)(dir, name));
              }
            });
          } else {
            res.forEach(({
              name
            }) => remoteFileList.push((0, _utils.normalizePath)(dir, name)));
            rs(remoteFileList);
          }
        }
      }).catch(e => {
        console.log(e);
        rj(e);
      });
    }

    _getRemoteList(sftp, rDir);
  });
}

var _default = {
  downloadDir,
  downloadFile
};
exports.default = _default;