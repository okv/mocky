'use strict';

var expect = require('expect.js'),
	mocky = require('../'),
	http = require('http'),
	listen = {host: '127.0.0.1', port: 4321};

describe('mocky', function() {
	var firstRoute
	it('start without errors', function() {
		mocky.createServer([{
			url: '/someurl?a=b&c=d',
			method: 'GET',
			res: {body: 'response for GET request'}
		}, {
			url: '/someurl?a=b&c=d',
			method: 'POST',
			req: {body: 'POST request body to match'},
			res: {body: 'response to return to client'}
		}, {
			url: '/someurl?a=b&c=d',
			method: 'PUT',
			req: {body: 'PUT request body to match'},
			res: function(req, reqBody) {
				return {body: '[ ' + reqBody + ' ]'};
			}
		}, {
			url: /\/someurl\?a=\d+/i,
			method: 'GET',
			res: {body: 'response for route with regexp'}
		}], {
			logLevel: 'none'
		}).listen(listen.port, listen.host);
	});

	it('respond on POST', function(done) {
		request({
			path: '/someurl?a=b&c=d',
			method: 'POST',
			data: 'POST request body to match'
		}, function(err, res) {
			expectResponseData(err, res, 'response to return to client', done);
		});
	});

	it('respond on GET', function(done) {
		request({
			path: '/someurl?a=b&c=d',
			method: 'GET'
		}, function(err, res) {
			expectResponseData(err, res, 'response for GET request', done);
		});
	});

	it('respond on PUT', function(done) {
		request({
			path: '/someurl?a=b&c=d',
			method: 'PUT',
			data: 'PUT request body to match'
		}, function(err, res) {
			expectResponseData(err, res, '[ PUT request body to match ]', done);
		});
	});

	it('respond from route with regexp', function(done) {
		request({
			path: '/someurl?a=123',
			method: 'GET'
		}, function(err, res) {
			expectResponseData(err, res, 'response for route with regexp', done);
		});
	});
});

function expectResponseData(err, res, data, done) {
	if (err) done(err);
	expect(res).have.key('data');
	expect(res.data).equal(data);
	done();
}

function request(params, callback) {
	params.host = listen.host;
	params.port = listen.port;
	var req = http.request(params, function(res) {
		var data = '';
		res.on('data', function(chunk) { data += chunk; });
		res.on('end', function() {
			callback(null, {res: res, data: data});
		});
	});
	req.on('error', function(err) { callback(err) })
	req.end(params.data ? params.data : null);
}
