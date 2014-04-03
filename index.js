var d=new Date().toString();
var http = require('http');
var url = require('url');
var fs = require('fs');
var rest = require('restler');
var async = require('async');

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' , err.stack);
  //process.exit(3);
});

rates={
 dollar:["USDILS=X",0,"1/1/2000","0:00pm"],
 euro:["EURILS=X",0,"1/1/2000","0:00pm"],
 bitsofgold: {buy:0,sell:0},
 bit2c: {"h":0,"l":0,"ll":0,"a":0,"av":0},
 bitgo: {"currentSellingPrice":0,"currentBuyingPrice":0,"amountAvalibleForSale":"0","amountAvalibleForBuy":0},
 bitcoinaverageUSD: { "24h_avg": 0, "ask": 0, "bid": 0, "last": 0, "timestamp": "Sun, 1 Jan 2000 00:00:00 -0000", "volume_btc": 0, "volume_percent": 0 },
 bitcoinaverageEUR: { "24h_avg": 0, "ask": 0, "bid": 0, "last": 0, "timestamp": "Sun, 1 Jan 2000 00:00:00 -0000", "volume_btc": 0, "volume_percent": 0 },
 bitstamp: {"high": "0", "last": "0", "timestamp": "0", "bid": "0", "vwap": "0", "volume": "0", "low": "0", "ask": "0"},
 btce:     {"ticker":{"high":0,"low":0,"avg":0,"vol":0,"vol_cur":0,"last":0,"buy":0,"sell":0,"updated":0,"server_time":0}},
 bitpay: [{"code":"USD","name":"US Dollar","rate":0},{"code":"ILS","name":"Israeli Shekel","rate":0}]
}

var prev_ils=0,prev_usd=0;
update=function(cb)
{
 async.series(
 [
   function(cb){try{ rest.get('http://download.finance.yahoo.com/d/quotes.csv?e=.csv&f=sl1d1t1&s=USDILS=X').on('complete', function(data) {  data=JSON.parse("["+data.trim().replace(/""/,"\\\"")+']'); if(typeof data=='object')rates.dollar=data; cb(); });  } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('http://download.finance.yahoo.com/d/quotes.csv?e=.csv&f=sl1d1t1&s=EURILS=X').on('complete', function(data) {  data=JSON.parse("["+data.trim().replace(/""/,"\\\"")+']'); if(typeof data=='object')rates.euro=data; cb(); });  } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://www.bitsofgold.co.il/api/btc').on('complete', function(data) { if(typeof data=='object') rates.bitsofgold=data; cb();  });  } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://www.bit2c.co.il/Exchanges/BtcNis/Ticker.json').on('complete', function(data) { if(typeof data=='object') rates.bit2c=data; cb();  });  } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://www.bitgo.co.il/components/loadcontrol.aspx?cn=statspanel&json=true').on('complete', function(data) {  if(typeof data=='object')  rates.bitgo=data; cb(); });  } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://api.bitcoinaverage.com/ticker/global/USD/').on('complete', function(data) { if(typeof data=='object') rates.bitcoinaverageUSD=data;  }); cb(); } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://api.bitcoinaverage.com/ticker/global/EUR/').on('complete', function(data) { if(typeof data=='object') rates.bitcoinaverageEUR=data;  }); cb();  } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://www.bitstamp.net/api/ticker/').on('complete', function(data) { if(typeof data=='object') Object.keys(data).forEach(function(a){data[a]=parseFloat(data[a])}); rates.bitstamp=data; cb(); });  } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://btc-e.com/api/2/btc_usd/ticker').on('complete', function(data) { data=JSON.parse(data); if(typeof data=='object') rates.btce=data;  }); cb(); } catch(e){console.log(e.stack);cb();} }
  ,function(cb){try{ rest.get('https://bitpay.com/api/rates').on('complete', function(data) { if(typeof data=='object')
{
var d=[];
if(data.length && data[prev_usd].code=='USD' && data[prev_ils].code=='ILS') 
{
 d=[data[prev_usd],data[prev_ils]];
}
else
for(var c,i=0;i<data.length;i++)
{
c=data[i];
if(c.code=='USD'){d.push(c);prev_usd=i}
if(c.code=='ILS'){d.push(c);prev_ils=i}
}
 rates.bitpay=d;
}
 cb(); });  } catch(e){console.log(e.stack);cb();} }

 ],cb
 )
}

var Canvas = require((require('os').arch()=='arm'?'./arm_node_modules/':'')+'canvas')
  , Font = Canvas.Font
  , mcanvas = new Canvas(20,20)
  , mctx = mcanvas.getContext('2d');

var fontarr=false;
function loadfonts(ctx)
{
 if (!Font) throw new Error('Need to compile with font support');
 if(fontarr===false){ fontarr=[];fs.readdirSync(__dirname+'/fonts').forEach(function(a){
var file= __dirname+'/fonts/'+a;
var namea=a.toLowerCase().split('.');
var name=namea[0]
if(namea[namea.length-1]=='ttf')
{
var font = new Font(name, file);
  //font.addFace(fontFile('PfennigBold.ttf'),   'bold');
  //font.addFace(fontFile('PfennigItalic.ttf'), 'normal', 'italic');
  //font.addFace(fontFile('PfennigBoldItalic.ttf'), 'bold', 'italic');
 fontarr.push(font);
}
});}
 if(ctx)
 for(var i=0;i<fontarr.length;i++)
 {
  ctx.addFont(fontarr[i]);
 }
}
loadfonts(mctx);

var index=fs.readFileSync(__dirname+'/index.html')
http.createServer(function (req, res) {
  if(req.url=='/rates'){  res.writeHead(200, {'Content-Type': 'text/javascript'}); res.end(JSON.stringify(rates, null, 2));}
  if(req.url=='/')     {  res.writeHead(200, {'Content-Type': 'text/html'}); res.end(index);}
  if(req.url=='/image')     {

mctx.antialias = 'none';
mctx.font = '14px Impact';
var te = mctx.measureText('Awesome!');
te.height=
 te.emHeightAscent//: 8,
+te.emHeightDescent;//: 2,

te.top=
 te.emHeightAscent //: 8
-te.actualBoundingBoxAscen//: 7

var canvas = new Canvas(te.width,te.height)
  , ctx = canvas.getContext('2d');

  ctx.antialias = 'none';
  ctx.font = '14px Impact';
  ctx.fillText("Awesome!", te.actualBoundingBoxLeft,te.emHeightAscent);
  res.writeHead(200, {'Content-Type': 'image/gif'}); 

var stream = canvas.createGIFStream();
stream.on('data', function(chunk){ res.write(chunk); });
stream.on('end', function(){ res.end() });

}
  else                 {  res.writeHead(404, {'Content-Type': 'text/plain'}); res.end(':-), since '+d+'\n');}
}).listen(3333);

console.log('Server running at http://127.0.0.1:3333/');
var  repl = require("repl");repl.start({ useGlobal:true,  useColors:true, });// uncomment to test


function run()
{
 update(function(){console.log('done');setTimeout(run,2000);});
}
run()
