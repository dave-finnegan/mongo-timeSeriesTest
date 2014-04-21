
load ("lz-string-1.3.3.js");

function TimeSeriesTestMongoDBz() {

    //print("\nTimeSeriesTestMongoDBLZ");
    db = db.getSiblingDB(dbname);

    this.csvToArray = function(csv) {

        var csvArrayz = new Array();
        var id_min=-1;
        var id_max=-1;
        var ts_beg=0;
        var ts_end=0;
        var min=1000;
        var max=0;
        var cnt=0;
        var sum=0;
        var ave=0;

        var csvHeaders = [];
        var lines = csv.split("\n");
        var zid = 0;
        var csv_tmp = "";
        for (var lcnt=0; lcnt<lines.length; lcnt++) {

            var line = lines[lcnt];
            if (lcnt == 0) {
                csvHeaders = line.split(",");
                continue;
            }
            if (lcnt > batch_size) {
                // The last newline causes there to be an empty record
                // batch_size+1, which breaks things if allowed to proceed
                break;
            }
            var cols = line.split(",");
            for (var ccnt=0; ccnt<cols.length; ccnt++) {

                // zid,id_min,id_max,ts_beg,ts_end,min,max,cnt,ave,docz

                // Capture min and max device_id
                if (csvHeaders[ccnt] == "device_id") {
                    if (id_min<0 || cols[ccnt]<id_min) {
                        id_min = +cols[ccnt];
                    }
                    if (cols[ccnt] > id_max) {
                        id_max = +cols[ccnt];
                    }
                }

                // Capture begin and end timestamps
                if (csvHeaders[ccnt] == "ts") {
                    if (csv_tmp == "") {
                        ts_beg = +cols[ccnt];
                        csv_tmp = csvHeader;
                    } else {
                        ts_end = +cols[ccnt];
                    }
                }

                // Capture min, max, and cnt values
                if (ccnt > 1) {
                    if (cols[ccnt] < min) {
                        min = +cols[ccnt];
                    }
                    if (cols[ccnt] > max) {
                        max = +cols[ccnt];
                    }
                    sum += +cols[ccnt];
                    cnt += 1;
                }

            } // cols

            csv_tmp += line+"\n";

            // Compress some rows
            if (lcnt % zcnt == 0) {

                var docz = {};

                ave = Math.floor(sum/cnt);

                docz["zid"] = zid;
                docz["id_min"] = id_min;
                docz["id_max"] = id_max;
                docz["ts_beg"] = ts_beg;
                docz["ts_end"] = ts_end;
                docz["min"] = min;
                docz["max"] = max;
                docz["cnt"] = cnt;
                docz["ave"] = ave;
                docz["docz"] = LZString.compress (csv_tmp);

                csvArrayz.push(docz);

                zid += 1;
                id_min=-1;
                id_max=-1;
                ts_beg=0;
                ts_end=0;
                min=1000;
                max=0;
                cnt=0;
                sum=0;
                ave=0;
                csv_tmp = "";

            }

        } // lines

        return csvArrayz;

    } // csvToArray

    this.simpleInsert = function(csv) { 
        for (var i=0; i<csv.length; i++) {
            db.ts.insert(csv[i]);  // dmf: N.B. 'ts' collection
        }
    }

    this.query1 = function(csv) {

        // select 1 random column where device_id in 4 random id's

        var dbdrvr = new TimeSeriesTestMongoDB();
        var ids = [];
        if (query_ids) {
            qids = query_ids.split(/[ ,]+/);
            for (var i=0; i<qids.length; i++) {
                ids.push(+qids[i]);
            }
        } else {
            for (var i=0; i<4; i++) {
                // N.B. use batch_size / comp_cnt for compressed data sets
                var rand = random(0, (batch_size/comp_cnt)-1);
                for (var j=0; ids.indexOf(rand)>=0 && j<batch_size; j++) {
                    //print ("dmf: duplicate id:"+rand+ " ids:"+ids);
                    var rand = random(0, (batch_size/comp_cnt)-1);
                }
                ids.push( rand )
            }
        }
        var cols = csvHeader.split(",");
        var col = cols[ random(2,28) ];
    
        // zid,id_min,id_max,ts_beg,ts_end,min,max,cnt,ave,docz
        var id_cnt = 0;
        for (var inx=0; inx<ids.length; inx++) {
            var id = ids[inx];
            // N.B. column selection would be done after decompressing docz
            // not here in the query of the compressed docz

            //print ("db.ts.find( { $and :[ { id_min : { $lte : "+id+" } }, { id_max : { $gte : "+id+" } } ] } )");

            var cursor = db.ts.find(
                { $and :
                  [
                      { id_min : { $lte : id } },
                      { id_max : { $gte : id } }
                  ]
                },
                { docz : 1}
            );
            //print ("returned from find");
            var cnt = cursor.count();
            // loop over cursor
            var cdoc = {};
            while (cursor.hasNext()) {
                cdoc = cursor.next();
                var ccsv = LZString.decompress (cdoc["docz"]);
                var carr = ccsv.split("\n");
                var ccols = carr[0].split(",");
                for (var cnx=0; cnx<carr.length-1; cnx++) {
                    ccols = carr[cnx].split(",");
                    if (ccols[0] == id) {
                        id_cnt += 1;
                        //print ("found:"+carr[cnx]);
                    }
                }
            }
        }

        return id_cnt;
    }

    this.query2 = function(csv) { 

        // select 1 random column where device_id in 4 random ids AND timestamp
        // between ts and ts+batch_cnt*ts_interval

        var dbdrvr = new TimeSeriesTestMongoDB();
        var ids = [];
        if (query_ids) {
            qids = query_ids.split(/[ ,]+/);
            for (var i=0; i<qids.length; i++) {
                ids.push(+qids[i]);
            }
        } else {
            for (var i=0; i<4; i++) {
                // N.B. use batch_size / comp_cnt for compressed data sets
                var rand = random(0, (batch_size/comp_cnt)-1);
                for (var j=0; ids.indexOf(rand)>=0 && j<batch_size; j++) {
                    //print ("dmf: duplicate id:"+rand+ " ids:"+ids);
                    var rand = random(0, (batch_size/comp_cnt)-1);
                }
                ids.push( rand )
            }
        }
        var cols = csvHeader.split(",");
        var col = cols[ random(2,28) ];
    
        // zid,id_min,id_max,ts_beg,ts_end,min,max,cnt,ave,docz
        var id_cnt = 0;
        for (var inx=0; inx<ids.length; inx++) {
            var id = ids[inx];
            var t1 = ts;
            var t2 = t1 + 400*ts_interval;
            // N.B. column selection would be done after decompressing docz
            // not here in the query of the compressed docz

            //print ("db.ts.find( { $and : [ { id_min : { $lte : "+id+" } }, { id_max : { $gte : "+id+" } }, { ts_beg : { $gte : "+t1+" } }, { ts_end : { $lte : "+t2+" } } ] } )");

            var cursor = db.ts.find(
                { $and :
                  [
                      { id_min : { $lte : id } },
                      { id_max : { $gte : id } },
                      { ts_beg : { $gte : t1 } },
                      { ts_end : { $lte : t2 } }
                  ]
                },
                { docz : 1}
            );
            var cnt = cursor.count();
            // loop over cursor
            var cdoc = {};
            while (cursor.hasNext()) {
                cdoc = cursor.next();
                var ccsv = LZString.decompress (cdoc["docz"]);                
                var carr = ccsv.split("\n");
                var ccols = carr[0].split(",");
                for (var cnx=0; cnx<carr.length-1; cnx++) {
                    ccols = carr[cnx].split(",");
                    if (ccols[0] == id &&
                        ccols[1] >= t1 &&
                        ccols[1] <= t2
                       ) {
                        id_cnt += 1;
                        //print ("found:"+carr[cnx]);
                    }
                }
            }
        }

        return id_cnt;
    }

    this.query3 = function(csv) { 

        // select 4 random columns where device_id in 4 random ids AND
        // timestamp between ts and ts+batch_cnt*ts_interval

        var dbdrvr = new TimeSeriesTestMongoDB();
        var ids = [];
        if (query_ids) {
            qids = query_ids.split(/[ ,]+/);
            for (var i=0; i<qids.length; i++) {
                ids.push(+qids[i]);
            }
        } else {
            for (var i=0; i<4; i++) {
                // N.B. use batch_size / comp_cnt for compressed data sets
                var rand = random(0, (batch_size/comp_cnt)-1);
                for (var j=0; ids.indexOf(rand)>=0 && j<batch_size; j++) {
                    //print ("dmf: duplicate id:"+rand+ " ids:"+ids);
                    var rand = random(0, (batch_size/comp_cnt)-1);
                }
                ids.push( rand )
            }
        }
        var cols = csvHeader.split(",");
        var tmp_cols = [];
        for (var i=0; i<4; i++) {
            var rand = random(2, 28);
            for (var j=0; tmp_cols.indexOf(rand)>=0 && j<4; j++) {
                var rand = random(2, 28);
            }
            tmp_cols.push( rand )
        }
        var col0 = tmp_cols[0];
        var col1 = tmp_cols[1];
        var col2 = tmp_cols[2];
        var col3 = tmp_cols[3];
    
        // zid,id_min,id_max,ts_beg,ts_end,min,max,cnt,ave,docz
        var id_cnt = 0;
        for (var inx=0; inx<ids.length; inx++) {
            var id = ids[inx];
            var t1 = ts;
            var t2 = t1 + 400*ts_interval;
            // N.B. column selection would be done after decompressing docz
            // not here in the query of the compressed docz

            //print ("db.ts.find( { $and : [ { id_min : { $lte : "+id+" } }, { id_max : { $gte : "+id+" } }, { ts_beg : { $gte : "+t1+" } }, { ts_end : { $lte : "+t2+" } } ] } )");

            var cursor = db.ts.find(
                { $and :
                  [
                      { id_min : { $lte : id } },
                      { id_max : { $gte : id } },
                      { ts_beg : { $gte : t1 } },
                      { ts_end : { $lte : t2 } }
                  ]
                },
                { docz : 1}
            );
            var cnt = cursor.count();
            // loop over cursor
            var cdoc = {};
            while (cursor.hasNext()) {
                cdoc = cursor.next();
                var ccsv = LZString.decompress (cdoc["docz"]);                
                var carr = ccsv.split("\n");
                var ccols = carr[0].split(",");
                for (var cnx=0; cnx<carr.length-1; cnx++) {
                    ccols = carr[cnx].split(",");
                    if (ccols[0] == id &&
                        ccols[1] >= t1 &&
                        ccols[1] <= t2
                       ) {
                        id_cnt += 1;
                        //print ("found:"+carr[cnx]);
                    }
                }
            }
        }

        return id_cnt;

    }

} // TimeSeriesTestMongoDB
