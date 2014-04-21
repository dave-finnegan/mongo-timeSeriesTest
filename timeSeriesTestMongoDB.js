
function TimeSeriesTestMongoDB() {

    //print("TimeSeriesTestMongoDB");
    db = db.getSiblingDB(dbname);

    this.csvToArray = function(csv) {

        var beg = new Date().getTime();

        var csvArray = new Array(); // or var csvArray = [];
        var csvHeaders = new Array();
        var lineCount = 0;
        var lines = csv.split("\n");
        for (var i=0; i<lines.length; i++) {
            var line = lines[i];
            if (lineCount == 0) {
                csvHeaders = line.split(",");
                lineCount += 1;
                continue;
            }
            if (lineCount > batch_size) {
                // The last newline causes there to be an empty record
                // batch_size+1, which breaks things if allowed to proceed
                break;
            }
            var doc = new Object(); // or var doc = {};
            var colCount = 0
            var cols = line.split(",");
            for (var j=0; j<cols.length; j++) {
                doc[ csvHeaders[colCount] ] = +cols[j]; // '+' to force to int
                colCount += 1;
            }
            csvArray.push(doc);
            lineCount += 1;
        }

        var end = new Date().getTime();
        var dur = (end-beg)/1000;

        return csvArray;
    }

    this.simpleInsert = function(csv) { 
        for (var i=0; i<csv.length; i++) {
            db.ts.insert(csv[i]);
        }
    }

    this.query1 = function(csv) {

        // select 1 random column where device_id in 4 random id's

        var ids = [];
        if (query_ids) {
            qids = query_ids.split(/[ ,]+/);
            for (var i=0; i<qids.length; i++) {
                ids.push(+qids[i]);
            }
        } else {
            for (var i=0; i<4; i++) {
                var rand = random(0, batch_size-1);
                for (var j=0; ids.indexOf(rand)>=0 && j<batch_size; j++) {
                    //print ("dmf: duplicate id:"+rand+ " ids:"+ids);
                    var rand = random(0, batch_size-1);
                }
                ids.push( rand )
            }
        }
        var cols = csvHeader.split(",");
        var col = cols[ random(2,28) ];
        var projection = {};
        projection[col] = 1;
        //printjson (projection);
    
        //print ("db.ts.find( { \"device_id\" : { \"$in\" : ["+ids+"] } }, "+JSON.stringify(projection)+" )");

        var cursor = db.ts.find(
            { "device_id" : { "$in" : ids } },
            projection
        );

        //for (var inx=0; inx<10 && cursor.hasNext(); inx++) {
        //    var xdoc = cursor.next();
        //    printjson (xdoc);
        //}

        var cnt = cursor.itcount();
        return cnt;
    }

    this.query2 = function(csv) {

        // select 1 random column where device_id in 4 random ids AND timestamp
        // between ts and ts+batch_cnt*ts_interval

        var ids = [];
        if (query_ids) {
            qids = query_ids.split(/[ ,]+/);
            for (var i=0; i<qids.length; i++) {
                ids.push(+qids[i]);
            }
        } else {
            for (var i=0; i<4; i++) {
                var rand = random(0, batch_size-1);
                for (var j=0; ids.indexOf(rand)>=0 && j<batch_size; j++) {
                    //print ("dmf: duplicate id:"+rand+ " ids:"+ids);
                    var rand = random(0, batch_size-1);
                }
                ids.push( rand )
            }
        }
        var cols = csvHeader.split(",");
        var col = cols[ random(2,28) ];
        var projection = {};
        projection[col] = 1;
        //printjson (projection);
        var t1 = ts;
        var t2 = t1 + 400*ts_interval;

        //print ("db.ts.find( { \"device_id\" : { \"$in\" : ["+ids+"] }, \"ts\" : { \"$gte\" : "+t1+", \"$lte\" : "+t2+"} }, "+JSON.stringify(projection)+" )");

        var cursor = db.ts.find(
            { "device_id" : { "$in" : ids },
              "ts" : { "$gte" : t1, "$lte" : t2 }
            },
            projection
        );

        //for (var inx=0; inx<10 && cursor.hasNext(); inx++) {
        //    var xdoc = cursor.next();
        //    printjson (xdoc);
        //}

        var cnt = cursor.itcount();
        return cnt;
    }

    this.query3 = function(csv) {

        // select 4 random columns where device_id in 4 random ids AND
        // timestamp between ts and ts+batch_cnt*ts_interval

        var ids = [];
        if (query_ids) {
            qids = query_ids.split(/[ ,]+/);
            for (var i=0; i<qids.length; i++) {
                ids.push(+qids[i]);
            }
        } else {
            for (var i=0; i<4; i++) {
                var rand = random(0, batch_size-1);
                for (var j=0; ids.indexOf(rand)>=0 && j<batch_size; j++) {
                    //print ("dmf: duplicate id:"+rand+ " ids:"+ids);
                    var rand = random(0, batch_size-1);
                }
                ids.push( rand )
            }
        }
        var cols = csvHeader.split(",");
        var tmp_cols = [];
        for (var i=0; i<4; i++) {
            var rand = random(2, 28);
            for (var j=0; tmp_cols.indexOf(rand)>=0 && j<4; j++) {
                //print ("dmf: duplicate id:"+rand+ " ids:"+ids);
                var rand = random(2, 28);
            }
            tmp_cols.push( rand )
        }
        var projection = {};
        for (var cnx=0; cnx<4; cnx++) {
            projection[tmp_cols[cnx]] = 1;
        }
        var t1 = ts;
        var t2 = t1 + 400*ts_interval;

        //print ("db.ts.find( { \"device_id\" : { \"$in\" : ["+ids+"] }, \"ts\" : { \"$gte\" : "+t1+", \"$lte\" : "+t2+"} }, "+JSON.stringify(projection)+" )");

        var cursor = db.ts.find(
            { "device_id" : { "$in" : ids },
              "ts" : { "$gte" : t1, "$lte" : t2 }
            },
            projection
        );

        var cnt = cursor.itcount();
        return cnt;
    }

} // TimeSeriesTestMongoDB
