const ctx = wx.createCanvasContext('shareCanvas')
import QR from '../../utils/wxqrcode.js';
const fsm = wx.getFileSystemManager();
const FILE_BASE_NAME = 'tmp_base64src'; //自定义文件名

function base64src(base64data, cb) {
  const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(base64data) || [];
  if (!format) {
    return (new Error('ERROR_BASE64SRC_PARSE'));
  }
  const filePath = `${wx.env.USER_DATA_PATH}/${FILE_BASE_NAME}.${format}`;
  const buffer = wx.base64ToArrayBuffer(bodyData);
  fsm.writeFile({
    filePath,
    data: buffer,
    encoding: 'binary',
    success() {
      cb(filePath);
    },
    fail() {
      return (new Error('ERROR_BASE64SRC_WRITE'));
    },
  });
};
Page({
  data: {
    canvasWidth : "",
    canvasHeight : "",
    canvasLeft : "",
    canvasTop : ""
  },
  /*
  获取图片，一般我们生成海报，海报上的二维码都是动态生成的，每次生成的二维码都不一样，且都是通过后台返回的图片地址。
  包括海报背景也是动态，后台返回会来的。所以我们现下载图片，生成临时路径。
  使用promise主要是海报可能有多个图片组成，必须等图片全部下载完成再去生成
  */
  getImage: function (url) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: url,
        success: function (res) {
          resolve(res)
        },
        fail: function () {
          reject("")
        }
      })
    })
  },
  getQRCodeSize: function () {
    var size = 0;
    try {
      var res = wx.getSystemInfoSync();
      var scale = res.windowWidth / 750; //不同屏幕下QRcode的适配比例；设计稿是750宽
      var width = 300 * scale;
      size = width;
    } catch (e) {
      // Do something when catch error
      console.log("获取设备信息失败" + e);
      size = 150;
    }
    return size;
  },
  getImageAll: function (image_src) {
    let that = this;
    var all = [];
    image_src.map(function (item) {
      all.push(that.getImage(item))
    })
    return Promise.all(all)
  },
  //创建
  create: function () {
    let that = this;
    let size = that.getQRCodeSize()
    //图片一把是通过接口请求后台，返回俩点地址，或者网络图片
    let _img = QR.createQrCodeImg('https://www.cnblogs.com/zzgyq/p/8882995.html', {
      size: parseInt(size)
    })
    let bg = 'http://statics.logohhh.com/forum/201610/24/170644l325qooyabhioyaa.jpg';
    //图片区别下载完成，生成临时路径后，在尽心绘制
    this.getImageAll([bg]).then((res) => {
      let bg = res[0];
      base64src(_img, res => {
        debugger
        console.log(res) // 返回图片地址，直接赋值到image标签即可
        let qr ={
          path: res,
          width: size,
          height: size,
       };
        //设置canvas width height position-left,  为图片宽高
        this.setData({
          canvasWidth : bg.width+'px',
          canvasHeight : bg.height+ 'px',
          canvasLeft : `-${bg.width + 100}px`,
        })
        let ctx = wx.createCanvasContext('canvas');
        ctx.drawImage(bg.path, 0, 0, bg.width, bg.height);
        ctx.drawImage(qr.path, bg.width - qr.width - 100, bg.height - qr.height - 150, qr.width * 0.8, qr.height * 0.8)
        ctx.setFontSize(20)
        ctx.setFillStyle('red')
        ctx.fillText('Hello world', bg.width - qr.width - 50, bg.height - qr.height - 190)
        ctx.draw()
        wx.showModal({
          title: '提示',
          content: '图片绘制完成',
          showCancel:false,
          confirmText : "点击保存",
          success : function () {
            that.save()
          }
        })
      });
    })
  },
  //保存
  save : function () {
    wx.canvasToTempFilePath({//canvas 生成图片 生成临时路径
      canvasId: 'canvas',
      success : function (res) {
        console.log(res)
        wx.saveImageToPhotosAlbum({ //下载图片
          filePath : res.tempFilePath,
          success : function () {
            wx.showToast({
              title : "保存成功",
              icon: "success",
            })
          }
        })
      }
    })
  }
})