const express = require('express');
var SerialPort = require('serialport');
const path = require('path')
const app = express();
const SockectIO = require('socket.io');
var cors = require('cors');

//settings
app.set('port', process.env.PORT || 3010);

//
console.log(path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({origin: '*'}));
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
app.get('/socket', function(req, res) {
    console.log("solicitud de conexion a socket");
    res.send('true');
  });

const io = SockectIO(server);

//websockets
io.on('connection', (socket) => {
    console.log("new connection", socket.id);
    //metodo para la gramera
    socket.on('gramera', (data) => {
      getdata();
    });
});

function getdata(){
    console.log("entra a medoto gramesa socket");
    SerialPort.list().then(ports => {
        ports.forEach(function (port) {
            console.log(port.path);
            console.log(port.manufacturer);
            if (port.path.includes('COM')) {
                sp = new SerialPort(port.path, {
                    buadRate: 9600
                });
                sp.on('open', () => {
                    console.log('done! arduino is now connected at port: ' + port.path)
                })
                sp.on('data', data => {
                    console.log(data.toString());
                    //aqui hacer una funcion que depende de la gramera devuelta el peso
                    io.sockets.emit('gramera',  data.toString() )
                    console.log("entra al if");
                    console.log("sale medoto gramesa socket");
                })
                sp.on('close', () => { 
                    console.log('Closed')  
                    //break;
                })
            }
        });
    });
}
