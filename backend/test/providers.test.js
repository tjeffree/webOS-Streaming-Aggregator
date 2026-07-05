import assert from 'node:assert/strict';
import {test} from 'node:test';

import {decorateOffers} from '../src/providers.js';

const offer = (packageId, technicalName, monetizationType) => ({
	monetizationType,
	package: {packageId, technicalName},
});

test('maps a Netflix subscription offer to the netflix service', () => {
	const out = decorateOffers([offer(8, 'netflix', 'FLATRATE')]);
	assert.equal(out.length, 1);
	assert.deepEqual(out[0], {
		key: 'netflix',
		name: 'Netflix',
		technicalName: 'netflix',
		monetization: ['FLATRATE'],
	});
});

test('folds Amazon subscription + rent/buy into one prime service', () => {
	const out = decorateOffers([
		offer(9, 'amazonprime', 'FLATRATE'),
		offer(10, 'amazon', 'RENT'),
		offer(10, 'amazon', 'BUY'),
	]);
	assert.equal(out.length, 1);
	assert.equal(out[0].key, 'prime');
	assert.deepEqual(out[0].monetization.sort(), ['BUY', 'FLATRATE', 'RENT']);
});

test('folds Apple TV+ and iTunes store into one appletv service', () => {
	const out = decorateOffers([
		offer(350, 'appletvplus', 'FLATRATE'),
		offer(2, 'itunes', 'RENT'),
	]);
	assert.equal(out.length, 1);
	assert.equal(out[0].key, 'appletv');
});

test('falls back to technicalName when packageId is unknown', () => {
	const out = decorateOffers([offer(99999, 'all4', 'ADS')]);
	assert.equal(out.length, 1);
	assert.equal(out[0].key, 'channel4');
});

test('drops offers on unmapped providers', () => {
	const out = decorateOffers([
		offer(12345, 'some-random-amazon-channel', 'FLATRATE'),
	]);
	assert.equal(out.length, 0);
});

test('mappingSummary lists every tracked service key', () => {
	const summary = decorateOffers.mappingSummary();
	const keys = summary.map((s) => s.key).sort();
	assert.deepEqual(keys, [
		'appletv',
		'channel4',
		'disney',
		'iplayer',
		'itvx',
		'netflix',
		'now',
		'prime',
	]);
});
