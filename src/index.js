import webscrape from 'webscrape';
import inputs from './inputs';
import Promise from 'bluebird';
import fs from 'fs';

const scraper = webscrape();

Promise.promisifyAll(fs);

function throttled(promiseGeneratingFn, batchSize = 100) {
	let count = 0;
	let waitChain = Promise.resolve();
	let promiseQueue = [];

	return (...args) => {
		if (count % batchSize === 0) {
			// awkward, because of the mutable aspect of promiseQueue
			waitChain = (
				(queue, count) => 
					waitChain.then(() => {
						console.log(`Completed ${count}`);
						return Promise.all(queue)
					})
				)(promiseQueue, count);
			promiseQueue = [];
		}

		const tail = waitChain.then(() => promiseGeneratingFn(...args));
		promiseQueue.push(tail);
		count += 1;
		return tail;
	}
}

function unrelenting(promiseGeneratingFn) {
	return (...args) => promiseGeneratingFn(...args).catch(() => unrelenting(promiseGeneratingFn)(...args));
}

async function tripInfo(from, to) {

	const { body } = await scraper.post('http://mrt.sg/tripcalc', {
		body: {
			station_a: from,
			station_b: to
		}
	});

	return { from, to, duration: /about ([0-9]+) minutes/.exec(body)[1] };
}


async function main(inputs, throttle = 100) {
	const promises = [];
	const len = inputs.length;
	const throttledTripInfo = throttled(unrelenting(tripInfo), throttle);

	for (var i = 0; i < len; i += 1) {
		for (var j = 0; j < len; j+= 1) {
			if (i !== j) {
				const station1 = inputs[i].symbol;
				const station2 = inputs[j].symbol;
				promises.push(throttledTripInfo(station1, station2));
			}
		}
	}

	const everything = await Promise.all(promises);
	const matrix = everything.reduce((acc, thing) => {
		acc[thing.from] = acc[thing.from] || {};
		acc[thing.from][thing.to] = thing.duration;
		return acc;
	}, {});

	return matrix;
}

async function execute() {
	try {
		const matrix = await main(inputs, 100);
		await fs.writeFileAsync('matrix.json', JSON.stringify(matrix, null, 4));
	} catch (e) {
		console.error(e.stack);
		for (let key in e) {
			if (key !== 'stack') {
				console.error(e[key]);
			}
		}
	}
}

execute();