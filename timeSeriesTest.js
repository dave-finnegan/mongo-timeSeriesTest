
// Copyright 2013, MongoDB Inc
// Author: Dave Finnegan; based upon work done by Henrik Ingo and Chris Biow
//
// Simulate time-series data feed and queries with MongoDB
//

// Variables required:
//   ts
//   tsi
//   bsiz
//   bcnt
//   zcnt
//   qcnts
//   qids
//   dbn
//   mdbh
//   mdbp
//   mdbn
//   drop
//   stat
//   noload
//   dbg
//
// query:
//   mongo --quiet localhost:27017 --eval "var drop=0; var stat=0; var noload=1; var mdbh=\"localhost\"; var mdbp=27017; var mdbn=\"ts-metrics\"; var dbg=0; var ts=1388552400; var tsi=60; var qids=\"280,564,950,342\"; bsiz=1000; var qcnts=\"1 2 4\"; var bcnt=1000; var zcnt=0; var dbn=\"ts-b1000-z0\";" timeSeriesTest.js
//
// load:
//   var drop=1; var stat=0; var noload=0; var mdbh="localhost"; var mdbp=27017; var mdbn="ts-metrics"; var dbg=0; var ts=1388552400; var tsi=60; var qids="280,564,950,342"; bsiz=1000; var qcnts="1 2 4"; var bcnt=1000; var zcnt=0; var dbn=ts-b1000-z0;


var starttime = ts;       // timestamp of first batch load (2014-01-01 00:00:00)
var ts_interval = tsi;    // time between each batch load
var batch_size = bsiz;    // rows in a batch (cols is a fixed 30)
var batch_cnt = bcnt;     // number of batches to load
var comp_cnt = zcnt;      // number of rows to encrypt at once
var query_cnts = qcnts;   // list of number of times to run queries
var query_ids = qids;     // list of device ids to query on; defaults to 4 random
var dbname = dbn;         // db name

var dbhp = getHostPort();
var dbhost = dbhp[0];     // db host
var dbport = dbhp[1];     // db port

csvHeader = "device_id,ts,col1,col2,col3,col4,col5,col6,col7,col8,col9,col10,col11,col12,col13,col14,col15,col16,col17,col18,col19,col20,col21,col22,col23,col24,col25,col26,col27,col28\n";

// You can, and should, create different loader functions to explore better
// performance with MongoDB or to port to other DBs
load("timeSeriesTestMongoDB.js");
load("timeSeriesTestMongoDBLZ.js");
        

if (zcnt == 0) {
    var dbdriver = new TimeSeriesTestMongoDB();
} else {
    var dbdriver = new TimeSeriesTestMongoDBz();
}
var setup_f = dbdriver.csvToArray;  // write the data to a csv file on disk;
var load_f = dbdriver.simpleInsert; // load the csv file with mongoimport;
var query1 = dbdriver.query1;       // 4 random id's, 1 random col
var query2 = dbdriver.query2;       // 4 random id's, 1 random col,
                                    //   t < timestamp < t+400*ts_interval
var query3 = dbdriver.query3;       // 4 random id's, 4 random cols,
                                    //   t < timestamp < t+400*ts_interval

function random(min,max) {
    return Math.floor((Math.random() * ((max + 1) - min)) + min);
}

function getCsvBatch(timestamp) {

    // Get 100k rows with an id field, timestamp field and 28 columns with
    // random integers.

    var csvBatch = csvHeader;
    
    for (var i=0; i<batch_size; i++) {
        var line = i + "," + timestamp;
        for (var j=0; j<27; j++) {
            var r = random(0,1000);
            line += "," + r
        }
        csvBatch += line + "\n";
    }

    return csvBatch;

} // getCsvBatch


function timeBatchLoading(csv,load,setup) {

    // Call function load(), which should load csv into mongo, and time it.
    // If setup() is given, first call r = setup(csv) and then load(r) with
    // return value of setup. Only load() is timed.

    if (typeof setup !== 'undefined') {
        var s_beg = new Date().getTime();
        csv = setup(csv);
        var s_end = new Date().getTime();
        var s_dur = (s_end - s_beg)/1000;
    }

    var l_beg = new Date().getTime();
    load(csv);
    var l_end = new Date().getTime();
    var l_dur = (l_end - l_beg)/1000;

    return [ s_dur, l_dur ];

}

function timeQuery(query) {

    // Call query() and time it
    var beg = new Date().getTime();
    var cnt = query()
    var end = new Date().getTime();

    return [(end - beg)/1000, cnt];
}

function getHostPort() {

    // Determines host and port for a connected mongod or mongos server
    //
    // The hostname and port are stored in the local.startup_log collection for
    // mongod processes, and in the config.mongos collection for mongos
    // processes.
    //
    // The local.startup_log collection may have several docs so we call find
    // with reversed sort and limit to one doc.  We then pull out the
    // 'hostname' and dig for the 'port' within the 'cmdLine' sub-doc.  If port
    // is not specified on the command line at mongod invocation time then we
    // substitute 27017.
    //
    // The config.mongos collection has the 'host:port' specification as the
    // '_id' for the doc.  We simply pull that value and parse out the hostname
    // and port.

    // Get a list of database names
    var dblst = db.adminCommand("listDatabases");
    var dbns = dblst["databases"];

    var dbh;
    var dbp;

    // Loop over database names
    for (dnx=0; dnx<dbns.length; dnx++) {

        var dbn = dbns[dnx]["name"];
        db2 = db.getSiblingDB(dbn);
        var dbcs = db2.getCollectionNames();
        for (cnx=0; cnx<dbcs.length; cnx++) {

            var dbc = dbcs[cnx];

            if (dbn == "local" && dbc == "startup_log") {

                var cursor = db2.startup_log.find({}).sort({_id:-1}).limit(1);

                while (cursor.hasNext()) {
                    cdoc = cursor.next();
                    dbh = cdoc["hostname"];
                    var cmdln = cdoc["cmdLine"];
                    dbp = cmdln["port"];
                    if (typeof(dbp) == "undefined") {dbp = 27017;}
                }

                //print ("found "+dbh+":"+dbp+" in "+dbn+"."+dbc);

            } // local.startup

            else if (dbn == "config" && dbc == "mongos") {

                var cursor = db2.mongos.find({}).sort({_id:-1}).limit(1);

                while (cursor.hasNext()) {
                    cdoc = cursor.next();
                    var dbhp = cdoc["_id"];
                    var dbh = dbhp.split(":")[0];
                    var dbp = dbhp.split(":")[1];
                }

                //print ("found "+dbh+":"+dbp+" in "+dbn+"."+dbc);

            } // config.mongos

        } // for dbcs

    } // for dbns

    //print (dbh+":"+dbp);
    return [dbh,dbp];

} // getHostPort


// main
if (dbg) {print ("\ntimeSeriesTest starting with:");}
if (dbg) {print ("  starttime:"+starttime);}
if (dbg) {print ("  ts_interval:"+ts_interval);}
if (dbg) {print ("  batch_size:"+batch_size);}
if (dbg) {print ("  batch_cnt:"+batch_cnt);}
if (dbg) {print ("  comp_cnt:"+comp_cnt);}
if (dbg) {print ("  query_cnts:"+query_cnts);}
if (dbg) {print ("  query_ids:"+query_ids);}

// Connect to metrics db server
if (mdbh != "undefined") {
    var mconn = new Mongo(mdbh+":"+mdbp);
    var mdb = mconn.getDB(mdbn);
}

//
// Load
//
if (noload != 1) {

    if (dbg) {print ("\nStarting load of "+batch_cnt+" batches . . .");}

    // Drop any existing db
    if (drop == 1) {
        if (dbg) {print ("\nDropping '"+dbname+"' database");}
        db = db.getSiblingDB(dbname);
        db.dropDatabase();
        if (zcnt == 0) {
		    db.ts.ensureIndex({"device_id":1});
		    db.ts.ensureIndex({"device_id":1, "ts":1});
        } else {
		    db.ts.ensureIndex({"id_min": 1});
		    db.ts.ensureIndex({"id_max": 1});
		    db.ts.ensureIndex({"id_min": 1, "id_max": 1});
		    db.ts.ensureIndex({"ts_beg": 1});
		    db.ts.ensureIndex({"ts_end": 1});
		    db.ts.ensureIndex({"ts_beg": 1, "ts_end": 1});
        }
    }

    var dt_beg = new Date();
    var beg = starttime;
    var timings = new Array();
    for (var i=1; i<=batch_cnt; i++) {
        beg = beg + ts_interval;
        csv = getCsvBatch(beg);
        var timers = timeBatchLoading(csv, load_f, setup_f);
        timings.push(timers);
        if (stat > 0) {
            if (i % 100 == 0) {
                print ("load:"+i)
            }
        }
    }
  
    var len = timings.length;
    var s_sum = 0;
    var l_sum = 0;
    for (var i=0; i<len; i++) {
        s_sum += timings[i][0];
        l_sum += timings[i][1];
    }
    t_setup = Math.round(s_sum*10000)/10000;
    t_load = Math.round(l_sum*10000)/10000;
    t_total = Math.round((t_setup+t_load)*10000)/10000;
    t_ave = Math.round(l_sum/batch_cnt*10000)/10000;
    compressed = (zcnt == 0) ? "0" : "1";
    //print ("\nSetup time: "+Math.round(s_sum*10000)/10000+" secs,"+
    //       " Load time: "+Math.round(l_sum*10000)/10000+" secs,"+
    //       " Load Ave:"+Math.round(l_sum/batch_cnt*10000)/10000+" secs/batch");
    print ("Batch-size,Total,Setup,Load,Load-ave,Batch-cnt,Compress-size");
    print (batch_size+","+t_total+","+t_setup+","+t_load+","+t_ave+","+batch_cnt+","+zcnt);

    if (mdbh != "undefined") {
        var mres = {};
        mres["DB-host"] = dbhost;
        mres["DB-port"] = dbport;
        mres["DB-name"] = dbname;
        mres["Batch-size"] = batch_size;
        mres["Batch-cnt"] = batch_cnt;
        mres["Compress-size"] = zcnt;
        mres["Total"] = t_total;
        mres["Setup"] = t_setup;
        mres["Load"] = t_load;
        mres["Load-ave"] = t_ave;
        mdb.load.insert(mres);
    }

} // load


//
// Query
//
if (query_cnts) {

    // Split counts on space or comma
    qcnts = query_cnts.split(/[ ,]+/);

    // Loop over query counts
    for (var qnx=0; qnx<qcnts.length; qnx++) {

        query_cnt = +qcnts[qnx];
        if (query_cnt == 0) { continue; }

        // Run each query query_cnt times

        var q_cnt = 0;

        // query1
        var dt_beg = new Date();
        timings = [];
        for (var i=0; i<query_cnt; i++) {
            //print ("\nExecuting query1");
            if (stat > 0) {
                if (i % 100 == 0) {
                    print ("query1:"+i)
                }
            }
            var timers = timeQuery(query1);
            timings.push(timers[0]);
            q_cnt = timers[1];
            //print ("query1 took: "+timer);
        }
        var len = timings.length;
        var sum = 0;
        for (var i=0; i<len; i++) {
            sum += timings[i];
        }
        print ("Query1 "+query_cnt+"x found:"+q_cnt+" time: "+Math.round(sum*10000)/10000+", Ave: "+Math.round(sum/query_cnt*10000)/10000+" secs/query");

        if (mdbh != "undefined") {
            var mres = {};
            mres["DB-host"] = dbhost;
            mres["DB-port"] = dbport;
            mres["DB-name"] = dbname;
            mres["Batch-size"] = batch_cnt;
            mres["Batch-cnt"] = batch_cnt;
            mres["Compress-size"] = zcnt;
            mres["Query-type"] = 1;
            mres["Query-cnt"] = query_cnt;
            mres["Found"] = q_cnt;
            mres["Time"] = Math.round(sum*10000)/10000;
            mres["Ave"] = Math.round(sum/query_cnt*10000)/10000;
            mdb.query.insert(mres);
        }

        // query2
        var dt_beg = new Date();
        timings = [];
        for (var i=0; i<query_cnt; i++) {
            //print ("\nExecuting query2");
            if (stat > 0) {
                if (i % 100 == 0) {
                    print ("query2:"+i)
                }
            }
            var timers = timeQuery(query2);
            timings.push(timers[0]);
            q_cnt = timers[1];
            //print ("query2 took: "+timer);
        }
        var len = timings.length;
        var sum = 0;
        for (var i=0; i<len; i++) {
            sum += timings[i];
        }
        print ("Query2 "+query_cnt+"x found:"+q_cnt+" time: "+Math.round(sum*10000)/10000+", Ave: "+Math.round(sum/query_cnt*10000)/10000+" secs/query");

        if (mdbh != "undefined") {
            var mres = {};
            mres["DB-host"] = dbhost;
            mres["DB-port"] = dbport;
            mres["DB-name"] = dbname;
            mres["Batch-size"] = batch_cnt;
            mres["Batch-cnt"] = batch_cnt;
            mres["Compress-size"] = zcnt;
            mres["Query-type"] = 2;
            mres["Query-cnt"] = query_cnt;
            mres["Found"] = q_cnt;
            mres["Time"] = Math.round(sum*10000)/10000;
            mres["Ave"] = Math.round(sum/query_cnt*10000)/10000;
            mdb.query.insert(mres);
        }

        // query3
        var dt_beg = new Date();
        timings = [];
        for (var i=0; i<query_cnt; i++) {
            //print ("\nExecuting query3");
            if (stat > 0) {
                if (i % 100 == 0) {
                    print ("query3:"+i)
                }
            }
            var timers = timeQuery(query3);
            timings.push(timers[0]);
            q_cnt = timers[1];
            //print ("query3 took: "+timer);
        }
        var len = timings.length;
        var sum = 0;
        for (var i=0; i<len; i++) {
            sum += timings[i];
        }
        print ("Query3 "+query_cnt+"x found:"+q_cnt+" time: "+Math.round(sum*10000)/10000+", Ave: "+Math.round(sum/query_cnt*10000)/10000+" secs/query");

        if (mdbh != "undefined") {
            var mres = {};
            mres["DB-host"] = dbhost;
            mres["DB-port"] = dbport;
            mres["DB-name"] = dbname;
            mres["Batch-size"] = batch_cnt;
            mres["Batch-cnt"] = batch_cnt;
            mres["Compress-size"] = zcnt;
            mres["Query-type"] = 3;
            mres["Query-cnt"] = query_cnt;
            mres["Found"] = q_cnt;
            mres["Time"] = Math.round(sum*10000)/10000;
            mres["Ave"] = Math.round(sum/query_cnt*10000)/10000;
            mdb.query.insert(mres);
        }

    } // Loop over query counts

} // Query
