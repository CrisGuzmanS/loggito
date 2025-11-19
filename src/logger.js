import winston, { createLogger, transports, format } from 'winston';
const { combine, timestamp, label, printf } = format;
import moment from 'moment';
import fs from 'fs';
import { join } from 'path';

const logFormat = printf(({ level, message, label, timestamp }) => {
    message = typeof message === 'object'
        ? JSON.stringify(message, null, 2)
        : message;

    return `${timestamp} ${level.toUpperCase()}: ${message}`;
});

let instance = null;
let instancePath = null;

/**
 * @returns {winston.Logger}
 */
const logger = (path = '') => {

    if (instance && instancePath != path && instancePath != null) {
        throw new Error('Logger already initialized');
    }

    instancePath = path;

    if (instance) {
        return instance;
    }

    path = join('logs', path ? path : '');

    // Si no existe el directorio lo creamos
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }

    const today = moment().format('YYYY-MM-DD_HH-mm-ss');

    const transportFile = new transports.File({
        filename: `${path}/${today}.log`,
        datePattern: 'YYYY-MM-DD HH:mm:ss',
        maxFiles: '30d',
    });

    instance = createLogger({
        level: 'info',
        format: combine(
            label({ label: 'app' }),
            format.timestamp({
                format: () => moment().format('YYYY-MM-DD HH:mm:ss')
            }),
            logFormat
        ),
        transports: [transportFile]
    });

    const originalClose = instance.close.bind(instance);

    instance.close = async function () {

        // cerrar transports de Winston correctamente
        await originalClose();

        // tu lógica adicional
        instance = null;
        instancePath = null;

        console.log("Logger closed.");
    };

    return instance;
}

export { logger };