// Built-in Node.js modules
var fs = require('fs')
var path = require('path')
var bodyParser = require('body-parser');
// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')

var public_dir = path.join(__dirname, 'public');
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

var app = express();
var port = 8000;

// open the database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(bodyParser.urlencoded({encoded: true}));

function newIncident(req, res) {
	return new Promise((resolve, reject) => {
		var message = "";
		var foundDuplicate = false;
		console.log("IN THIS FUNCTION!");
		
		var dateTime = req.body.date + "T" + req.body.time;
		
		
		
		
		//console.log(req.body.caseNumber + ", " + req.body.dateTime);
		
		db.all("SELECT case_number FROM Incidents", (err, rows) => {
			if (err) {
				console.log("error is here!");
				throw err;
			}
			for (key in rows) {
				
				var a = parseInt(rows[key].case_number, 10);
				var b = parseInt(req.body.case_number, 10);
				
				if (a == b) {
					console.log(a + "is equal to " + b);
					res.status(500).send('Error, case number already exists in the database');
					resolve("ERROR!");
					foundDuplicate = true;
				}
			}
			if (!foundDuplicate) {
				console.log("here!");
				console.log(req.body.case_number + "  " + dateTime + "  " + req.body.code + "   " + req.body.incident + "   " + req.body.police_grid + "  " + req.body.neighborhood_number + "  " + req.body.block);
				db.all("INSERT INTO Incidents VALUES (?, ?, ?, ?, ?, ?, ?)", [req.body.case_number], [dateTime], [req.body.code], [req.body.incident], [req.body.police_grid], [req.body.neighborhood_number], [req.body.block], (err, new_rows) => {
					if (err) {
						console.log('error is hereree');
						throw err;
					}
					res.status(200).send('Success!');
				});
				resolve("Success!");
			}
		});
		
		
	});
}

function getIncidents() {
	return new Promise((resolve, reject) => {
		var incidents = {};
		db.all("SELECT case_number, date_time, code, incident, police_grid, neighborhood_number, block FROM Incidents", (err, rows) => {
			if (err) {
				throw err;
			}
			for (var key in rows) {
				
				var currentValue = {};
				
				currentValue["date"] = rows[key].date_time.slice(0, 10);
				currentValue["time"] = rows[key].date_time.slice(11, 19);
				currentValue["code"] = rows[key].code;
				currentValue["incident"] = rows[key].incident;
				currentValue["police_grid"] = rows[key].police_grid;
				currentValue["neighborhood_number"] = rows[key].neighborhood_number;
				currentValue["block"] = rows[key].block;
				
				incidents["I" + rows[key].case_number] = currentValue;
			}
			resolve(incidents);
		});
	});
}

function getNeighborhoods() {
	return new Promise((resolve, reject) => {;
		var hoods = {};
		db.all("SELECT neighborhood_number, neighborhood_name FROM Neighborhoods", (err, rows) => {
			if (err) {
				throw err;
			}
			for (var key in rows) {
				hoods["N" + rows[key].neighborhood_number] = rows[key].neighborhood_name;
			}
			resolve(hoods);
		});
	});
}

function getCodes() {
	return new Promise((resolve, reject) => {
		var codes = {};
		db.all("SELECT code, incident_type FROM Codes", (err, rows) => {
			if (err) {
				throw err;
			}
			for (var key in rows) {
				codes["C" + rows[key].code] = rows[key].incident_type;
			}
			resolve(codes);
		});
	});
}

app.get('/codes', (req, res) => {
	
	Promise.all([getCodes()]).then((data) => {
		//console.log(data);
		res.type('json').send(data);
    }).catch((err) => {
        console.log("error");
    });
	
});

app.get('/neighborhoods', (req, res) => {
	
	Promise.all([getNeighborhoods()]).then((data) => {
		res.type('json').send(data);
    }).catch((err) => {
        console.log("error");
    });
	
});

app.get('/incidents', (req, res) => {
	
	Promise.all([getIncidents()]).then((data) => {
		res.type('json').send(data);
    }).catch((err) => {
        console.log("error");
    });
	
});

app.put('/new-incident', (req, res) => {
	console.log("in the put!");
	Promise.all([newIncident(req, res)]).then((data) => {
		console.log("You have tried to add an incident!");
		console.log("DATA = " + data);
    }).catch((err) => {
		console.log(err);
        console.log("error at the bottom!");
    });
	
});





var server = app.listen(port);