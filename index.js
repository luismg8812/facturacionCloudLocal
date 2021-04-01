const express = require('express');
var SerialPort = require('serialport');
const path = require('path')
const app = express();
const SockectIO = require('socket.io');
var cors = require('cors');
//var printer = require('printer');
var fs = require('fs');

var document;
//var info = fs.readFileSync("C:/facturas/factura_41.pdf");

function sendPrint() {
  /*printer.printDirect({
    data: document,
    printer: printer.getDefaultPrinterName(),
    type: 'RAW',
    success: function (jobID) {
      console.log("ID: " + jobID);
    },
    error: function (err) {
      console.log('printer module error: ' + err);
      throw err;
    }
  });*/
}

//settings
app.set('port', process.env.PORT || 3010);

//
console.log(path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

//star server
const server = app.listen(app.get('port'), () => {
  console.log('server on port', app.get('port'));
});
// respond with "hello world" when a GET request is made to the homepage
app.get('/socket', function (req, res) {
  console.log("solicitud de conexion a socket");
  res.send('true');
});

const io = SockectIO(server);

//websockets
io.on('connection', (socket) => {
  console.log("new connection", socket.id);
  //metodo para la gramera
  socket.on('gramera', (data) => {
    getdata(data);
  });
  socket.on('printer', (filename) => {
   // setTimeout(printered(filename), 3000);

  });
});

function printered(filename) {
  console.log(filename);
  fs.readFile("C:/facturas/" + filename, function (err, data) {
    if (err) throw err;

    document = data;
    sendPrint();
  });
  console.log(printer.getDefaultPrinterName());
  //console.log(printer.getSupportedPrintFormats());

}

function getdata(gramera) {
  console.log("entra a medoto gramera socket:" + gramera);
  SerialPort.list().then(ports => {
    for (let port of ports) {
      console.log(port.path);
      console.log(port.manufacturer);
      if (port.path.includes('COM')) {
        port = new SerialPort(port.path, {
          buadRate: 9600
        });
        port.on('open', () => {
          console.log('done! gramera is now connected at port: ' + port.path)
        })

        var acum = '';
        var data = "";
        port.on('readable', function () {

          acum = acum + port.read().toString();
         // console.log(acum);
          switch (Number(gramera)) {
            case 0:
              console.log("gramera 0");
              break;
            case 1:
              console.log("gramera 1");
              if (acum.includes('+') && acum.includes('Kg')) {
                data = acum.replace(/\r?\n|\r/g, '');
                data = data.replace(/ /g, '');
                data = data.replace("Ut:       0", '');
                data = data.replace("Tt:       0", '');
                data = data.replace(/[a-z]/g, '');
                data = data.replace(/[A-Z]/g, '');
                data = data.replace(/:/g, '');
                data = data.replace(/,/g, '');
                data = data.replace("+", '');

                console.log('Data:', data)
                console.log("completo");
                console.log("acum:", acum);
                acum = "";
                if (!isNaN(data)) {
                  console.log("es numerico");
                  io.sockets.emit('gramera', data)
                }
              }
              break;
            case 2:
              if (acum.includes('=')&& acum.includes('.')) {
                data = acum.replace(/\r?\n|\r/g, '');
                data = data.replace(/ /g, '');
                data = data.replace(/=/g, '');

                console.log('Data:', data)
                console.log("completo");
                console.log("acum:", acum);
                acum = "";
                if (!isNaN(data)) {
                  var x = data.length;
                  var cadenaInvertida = "";
                  while (x >= 0) {
                    cadenaInvertida = cadenaInvertida + data.charAt(x);
                    x--;
                  }
                  console.log("es numerico");
                  io.sockets.emit('gramera', cadenaInvertida)
                }
              }
              break;
            default:
            // code block
          }

        })
        port.on('close', () => {
          console.log('Closed')
        })
      }
    }
  });
}
