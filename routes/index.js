var express = require('express');
var router = express.Router();
var sizeOf = require('image-size');
var jimp = require('jimp');
var mergeImg = require('merge-img')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/blurImage', function(req, res, next){ // blurring image
  const image = req.body.image;
  try{
    var img = Buffer.from(image.substr(22), 'base64');
    var dimensions = sizeOf(img);
    const imageWidth = dimensions.width; // uploaded image width
    const imageHeight = dimensions.height; // uploaded image height
    const frameWidth = 472; // frame width
    const frameHeight = 836; // frame height
    let realWidth = 0, realHeight = 0; // calced width and height

    if(imageWidth/imageHeight > frameWidth/frameHeight) { // means we should set the width as frameWidth
        realWidth = frameWidth;
        realHeight = imageHeight * parseFloat(frameWidth / imageWidth); // Calc the height
    } else {
        realHeight =  frameHeight;
        realWidth = imageWidth * parseFloat(frameHeight / imageHeight);
    }

    const smallWidth = (frameWidth - realWidth); // The width of space
    const smallHeight = (frameHeight - realHeight); // THe height of space

    let x,y,width,height;
    console.log(realWidth, realHeight);
    console.log(smallWidth, smallHeight);

    if(smallWidth === 0) { // space is in the bottom
      x = 0;
      y = (frameHeight - smallHeight *2) < 0 ? 0 : (frameHeight - smallHeight *2);
      width = frameWidth;
      height = smallHeight > realHeight ? realHeight : smallHeight;
    } else { // space is in the right
      x = (frameWidth - smallWidth * 2) < 0 ? 0 : (frameWidth - smallWidth * 2);
      y = 0;
      width = smallWidth > realWidth ? realWidth : smallWidth;
      height = frameHeight;
    }

    console.log(x,y, width, height)
    jimp.read(img, (err, image) => {
      if(err) throw err;
      else {
        image.resize(realWidth, realHeight) // resize image depends on frameWidth then there would be a space
        .quality(100)
        .getBase64(jimp.MIME_JPEG, function (ferr, src) {
          var resizedImage = Buffer.from(src.substr(22), 'base64'); // get base64 of resized image
          jimp.read(resizedImage, (rErr, rImage) => {
            if(rErr) throw rErr;
            else {
              try{
                rImage.crop(parseInt(x),parseInt(y),parseInt(width),parseInt(height)) // crop image of above space of the image
                .blur(30) // blur that image
                .getBase64(jimp.MIME_JPEG, function(cerr, csrc) {
                  var cropedImage = Buffer.from(csrc.substr(22), 'base64');
                  mergeImg([resizedImage, cropedImage], {direction:smallWidth === 0 ? true : false}).then((mImg)=>{ // merge image with the resized image and blurred iamge
                    mImg.quality(100).getBase64(jimp.MIME_JPEG, function(mgErr, mgImg){
                      var mergedImage = Buffer.from(mgImg.substr(22), 'base64');
                      res.status(200).send({status: 'true', data:mergedImage}); // send image to front end
                    })
                  });
                })
              } catch(e) {
                // reImage = Buffer.from(rImage.substr(22), 'base64');
                res.status(200).send({status: 'fail in cropping image', data: resizedImage}) // send the resized image if fail
              }
            }
          })
        })
      }
    })
  } catch(e){
    console.log(e)
  }
  //res.status(200).send({ status: 'fail' });
})

module.exports = router;
