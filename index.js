const express = require('express');
const printer =require('pdf-to-printer');
var pdf = require('html-pdf');
var SerialPort = require('serialport');
const path = require('path')
const app = express();
const SockectIO = require('socket.io');
var cors = require('cors');
//var printer = require('printer');
var fs = require('fs');

var document;
//var info = fs.readFileSync("C:/facturas/CONTRATO DE TRABAJO.pdf");

function peso(kg){
  const content = 'peso: '+kg;

fs.writeFile('C:/facturas/peso.txt', content, err => {
  if (err) {
    console.error(err);
  }
  console.log("funcion peso: "+kg)
});
}




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
    console.log(filename);
    if(filename.includes(".pdf")){
      imprimirPDF(filename)
    }else{
      imprimirTXT(filename);
    }
    
    
  });
});

 function imprimirTXT(filename){
  let rutaArchivo="C:/facturas/";
  //var info = fs.readFileSync('ticket.txt').toString();
  fs.readFile("C:/facturas/FACTURA DE VENTA._10_2__1_1.txt", function (err1, data) {
    if (err1) {
      console.log(err1);
      throw err1;
    };
    console.log(data);
    pdf.create(data.toString()).toFile(rutaArchivo+'salida.pdf', function(err, res) {
      if (err){
          console.log(err);
      } else {
          console.log(res);
          setTimeout(imprimirPDF(rutaArchivo+'salida.pdf'), 2000);
      }
  });
  
  });
  console.log("aqui llega");
}

function imprimirPDF(filename){
  console.log(filename);
  console.log("C:/facturas/"+filename);
  printer.print("C:/facturas/"+filename)
  .then(console.log("documento impreso "+filename))
  .catch(console.error);
}

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
        if(Number(gramera)==3){
          console.log("gramera3:"+gramera);
          port.write('P');
        }
        port.on('readable', function () {

          acum = acum + port.read(); 
         // console.log(acum);
          switch (Number(gramera)) {
            case 0:
              console.log("gramera 0");
              break;
            case 1:
             // console.log("gramera 1");
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
                  fs.writeFile("C:/facturacion/peso.txt", data+"\n", function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                }); 
               /* fs.readFile("C:/facturacion/peso.txt", function (err1, data) {
                  if (err1) {
                    console.log(err1);
                    throw err1;
                  };
                  console.log(data.toString());
                
                });*/
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
              case 3:
                if(!acum.includes('.')){
                  acum = acum + port.read(); 
              
                }else{
                      port.close(function () {
                    console.log('port closed');
                });
                }
                console.log("gramera 3");
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
