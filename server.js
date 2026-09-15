const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');


const db = new DatabaseSync('restaurante.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL,
        telefono TEXT NOT NULL
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        personas INTEGER NOT NULL
    )
`);

const insertarCliente = db.prepare(`
    INSERT INTO clientes (nombre, correo, telefono)
    VALUES (?, ?, ?)
`);

const insertarReserva = db.prepare(`
    INSERT INTO reservas (cliente_id, fecha, hora, personas)
    VALUES (?, ?, ?, ?)
`);


// Envía un archivo estático leído del disco con el Content-Type dado.
function enviarArchivo(res, archivo, contentType) {
    try {
        const contenido = fs.readFileSync(path.join(__dirname, archivo));
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(contenido);
    } catch (error) {
        console.error(`Error al leer ${archivo}:`, error);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`
            <h1>Error interno</h1>
            <p>No fue posible cargar el recurso solicitado.</p>
        `);
    }
}


function leerCuerpo(req, callback) {
    let cuerpo = '';

    req.on('data', (fragmento) => {
        cuerpo += fragmento.toString();
    });

    req.on('end', () => {
        callback(cuerpo);
    });
}

function responderError400(res, mensaje, urlRegreso) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(`
        <h1>Solicitud incorrecta</h1>
        <p>${mensaje}</p>
        <a href="${urlRegreso}">Regresar</a>
    `);
}

function responderError500(res, mensaje) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(`
        <h1>Error interno</h1>
        <p>${mensaje}</p>
    `);
}

// Servidor
const server = http.createServer((req, res) => {
    console.log('Método:', req.method);
    console.log('URL:', req.url);

    //  Páginas HTML
    if (req.method === 'GET' && req.url === '/') {
        return enviarArchivo(res, 'index.html', 'text/html; charset=UTF-8');
    }

    if (req.method === 'GET' && req.url === '/acerca') {
        return enviarArchivo(res, 'acerca.html', 'text/html; charset=UTF-8');
    }

    if (req.method === 'GET' && req.url === '/registro') {
        return enviarArchivo(res, 'registro.html', 'text/html; charset=UTF-8');
    }

    if (req.method === 'GET' && req.url === '/servicios') {
        return enviarArchivo(res, 'servicios.html', 'text/html; charset=UTF-8');
    }

    //  Hoja de estilos externa 
    if (req.method === 'GET' && req.url === '/styles.css') {
        return enviarArchivo(res, 'styles.css', 'text/css; charset=UTF-8');
    }

    //  Registro de cliente (tabla principal) 
    if (req.method === 'POST' && req.url === '/clientes') {
        leerCuerpo(req, (cuerpo) => {
            const datos = new URLSearchParams(cuerpo);

            const nombre = datos.get('nombre')?.trim();
            const correo = datos.get('correo')?.trim();
            const telefono = datos.get('telefono')?.trim();

            console.log('Nombre:', nombre);
            console.log('Correo:', correo);
            console.log('Teléfono:', telefono);

            if (!nombre || !correo || !telefono) {
                return responderError400(
                    res,
                    'Todos los campos (nombre, correo, teléfono) son obligatorios.',
                    '/registro'
                );
            }

            try {
                const resultado = insertarCliente.run(nombre, correo, telefono);

                console.log('Cliente almacenado con id:', resultado.lastInsertRowid);

                res.writeHead(201, { 'Content-Type': 'text/html; charset=UTF-8' });
                return res.end(`
                    <h1>Cliente registrado</h1>
                    <p>La información fue almacenada correctamente.</p>
                    <p>Tu identificador de cliente es:</p>
                    <p class="id-generado">${resultado.lastInsertRowid}</p>
                    <p>Guarda este número; lo necesitarás para reservar tu mesa.</p>
                    <a href="/servicios">Ir a Servicios</a> |
                    <a href="/registro">Registrar otro cliente</a>
                `);
            } catch (error) {
                console.error('Error al almacenar el cliente:', error);
                return responderError500(
                    res,
                    'No fue posible almacenar la información del cliente.'
                );
            }
        });

        return;
    }

    // Registro de reserva (tabla de operaciones) 
    if (req.method === 'POST' && req.url === '/reservas') {
        leerCuerpo(req, (cuerpo) => {
            const datos = new URLSearchParams(cuerpo);

            const clienteIdTexto = datos.get('cliente_id')?.trim();
            const fecha = datos.get('fecha')?.trim();
            const hora = datos.get('hora')?.trim();
            const personasTexto = datos.get('personas')?.trim();

            console.log('cliente_id:', clienteIdTexto);
            console.log('Fecha:', fecha);
            console.log('Hora:', hora);
            console.log('Personas:', personasTexto);

            if (!clienteIdTexto || !fecha || !hora || !personasTexto) {
                return responderError400(
                    res,
                    'Todos los campos (identificador de cliente, fecha, hora, personas) son obligatorios.',
                    '/servicios'
                );
            }

            const clienteId = Number(clienteIdTexto);
            const personas = Number(personasTexto);

            if (!Number.isInteger(clienteId) || clienteId <= 0) {
                return responderError400(
                    res,
                    'El identificador de cliente debe ser un número entero válido.',
                    '/servicios'
                );
            }

            if (!Number.isInteger(personas) || personas <= 0) {
                return responderError400(
                    res,
                    'El número de personas debe ser un número entero mayor que cero.',
                    '/servicios'
                );
            }

            try {
                const resultado = insertarReserva.run(clienteId, fecha, hora, personas);

                console.log('Reserva almacenada con id:', resultado.lastInsertRowid);

                res.writeHead(201, { 'Content-Type': 'text/html; charset=UTF-8' });
                return res.end(`
                    <h1>Reserva registrada</h1>
                    <p>Tu reserva fue almacenada correctamente.</p>
                    <p>Número de reserva: <strong>${resultado.lastInsertRowid}</strong></p>
                    <a href="/servicios">Registrar otra reserva</a> |
                    <a href="/">Volver al inicio</a>
                `);
            } catch (error) {
                console.error('Error al almacenar la reserva:', error);
                return responderError500(
                    res,
                    'No fue posible almacenar la reserva.'
                );
            }
        });

        return;
    }

    // Ruta inexistente 
    res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
    return res.end('<h1>404 - Página no encontrada</h1>');
});

server.listen(3000, () => {
    console.log('Servidor disponible en http://localhost:3000');
});
