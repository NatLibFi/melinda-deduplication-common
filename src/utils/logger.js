// @flow
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * Shared modules for microservices of Melinda deduplication system
 *
 * Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-deduplication-common
 *
 * melinda-deduplication-common is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * melinda-deduplication-common is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 **/

const winston = require('winston');
const moment = require('moment');

function createLogger() {
	const timestamp = winston.format(info => {
		info.timestamp = moment().format();
		return info;
	});

	return winston.createLogger({
		level: process.env.NODE_ENV === 'debug' ? 'debug' : 'info',
		format: winston.format.combine(
			timestamp(),
			winston.format.printf(i => `${i.timestamp} - ${i.level}: ${i.message}`)
		),
		transports: [
			new winston.transports.Console()
		]
	});
}

const logger = createLogger();
logger.createLogger = createLogger;
module.exports = logger;
