#!/bin/bash

#set -x

scriptnm=`echo $0 | sed 's@.*/\(.*\)@\1@'`

# Default values
dt="2014-01-01 00:00:00"
# date -j -f '%Y-%m-%d %H:%M:%S' '2014-01-01 00:00:00' +%s
ts=`date -j -f '%Y-%m-%d %H:%M:%S' "$dt" +%s`
tsi=60
bsiz=1000
bcnt=1000
qcnts="1 2 4"
qids="280,564,950,342"
dbh=localhost
dbp=27017
dbn=ts
dbc=ts
zcnt=0
drop=0
stat=0
noload=0
dbg=0
terse=1
mdbh="undefined"
mdbp=27017
mdbn="ts-metrics"

# Usage function
usage ()
{
  if [ $# -gt 0 ]; then
    echo ""
    echo $1
  fi
  echo ""
  echo "Usage: $scriptnm -timestamp date -timestamp_interval secs"
  echo "       -batch_siz bsiz -batch_cnt bcnt"
  echo "       -query_cnts qcnts -query_ids qids"
  echo "       -db_host host -db_port port -db_name name"
  echo "       -mdb_host mhost -mdb_port mport -mdb_name mname"
  echo "       -comp_cnt zcnt -drop -stat -noload"
  echo "       -verbose -help"
  echo ""
  echo "Example:"
  echo "  $scriptnm -ts $ts -tsi $tsi -bsiz $bsiz -bcnt $bcnt -qcnts \"$qcnts\" -qids \"$qids\" -dbh $dbh -dbp $dbp -dbn ${dbn}-b${bcnt}-z${zcnt} -zcnt $zcnt"
  [ $terse -eq 1 ] && exit 1
  echo ""
  echo "Where:"
  echo "  date       initial timestamp (e.g. 2014-01-01 00:00:00)"
  echo "  secs       timestamp interval between batch loads"
  echo "  size       rows in a batch; (30 cols/row)"
  echo "  bcnt       number of batches to load"
  echo "  qcnts      list of number of times to run each query type"
  echo "  qids       list of device ids to query on; defaults to 4 random ids"
  echo "  host       hostname of mongod server to connect to"
  echo "  port       port of mongod server to connect to"
  echo "  name       database name to connect to"
  echo "  mhost      hostname of metrics mongod server to connect to"
  echo "  mport      port of metrics mongod server to connect to"
  echo "  mname      metrics database name to connect to; for metrics results"
  echo "  zcnt       enable commpression of zcnt rows at a time (sets dbn=tsz!)"
  echo "  drop       drop named database before proceeding with load"
  echo "  stat       show status as 'c' (100 batch inserts), 'k' (1000 inserts)"
  echo "  noload     don't run the load command"
  echo "  verbose    show some additional output"
  echo "  defaults:"
  echo "    date: $dt"
  echo "    secs: $tsi"
  echo "    size: $bsiz"
  echo "    bcnt: $bcnt"
  echo "    qcnts: $qcnts"
  echo "    quids: \"$qids\""
  echo "    host: $dbh"
  echo "    port: $dbp"
  echo "    name: $dbn (collection: $dbc)"
  echo "    mhost: $mdbh"
  echo "    mport: $mdbp"
  echo "    mname: $mdbn"
  echo "    zcnt: $zcnt"
  echo "    drop: $drop"
  echo "    stat: $stat"
  echo "    noload: $noload"
  echo "    verb: $dbg"
  exit 1
}

# Check for args
[ $# -lt 1 ] && usage

# Parse the command line
while [ $# -gt 0 ]; do

    case $1 in

        # help
        -h | -help) terse=0 ; usage ;;

        # initial timestamp
        -ts | -timestamp) dt=$2 ;
            ts=`date -j -f '%Y-%m-%d %H:%M:%S' "$dt" +%s`
            shift
            ;;

        # timestamp interval
        -tsi | -timestamp_interval) tsi=$2 ; shift ;;

        # batch size
        -bsiz | -batch_siz) bsiz=$2 ; shift ;;

        # batch count
        -bcnt | -batch_cnt) bcnt=$2 ; shift ;;

        # query count
        -qcnts | -query_cnts) qcnts="$2" ; shift ;;

        # query ids
        -qids | -query_ids) qids="$2" ; shift ;;

        # db host
        -dbh | -db_host) dbh=$2 ; shift ;;

        # db port
        -dbp | -db_port) dbp=$2 ; shift ;;

        # db name
        -dbn | -db_name) dbn=$2 ; shift ;;

        # metrics db host
        -mdbh | -mdb_host) mdbh=$2 ; shift ;;

        # metrics db port
        -mdbp | -mdb_port) mdbp=$2 ; shift ;;

        # metrics db name
        -mdbn | -mdb_name) mdbn=$2 ; shift ;;

        # compression row count
        -zcnt | -comp_cnt) zcnt=$2 ; shift ;
            # [ $zcnt -gt 0 ] && dbc=tsz ;
            ;;

        # drop database
        -drop) drop=1 ;; # no shift

        # do not show status
        -stat) stat=1 ;; # no shift

        # don't load data
        -noload) noload=1 ;; # no shift

        # show verbose output
        -v | -verb | -verbose) dbg=1 ;; # no shift

        # illegal argument
        *) usage "Illegal argument: '$1'" ;;

    esac
    shift

done

# echo "dt: $dt"
# echo "ts: $ts"
# echo "tsi: $tsi"
# echo "bsiz: $bsiz"
# echo "bcnt: $bcnt"
# echo "qcnts: $qcnts"
# echo "qids: $qids"
# echo "dbh: $dbh"
# echo "dbp: $dbp"
# echo "dbn: $dbn"
# echo "zcnt: $zcnt"
# echo "noload: $noload"
# echo "dbg: $dbg"


mongo --quiet --host ${dbh} --port ${dbp} ${dbn} --eval "var ts=${ts}; var tsi=${tsi}; var bsiz=${bsiz}; var bcnt=${bcnt}; var qcnts=\"${qcnts}\"; var qids=\"${qids}\"; var mdbh=\"${mdbh}\"; var mdbp=${mdbp}; var mdbn=\"${mdbn}\"; var dbn=\"${dbn}\"; var dbc=\"${dbc}\"; var zcnt=${zcnt}; var stat=${stat}; var noload=${noload}; var drop=${drop}; var dbg=${dbg};" timeSeriesTest.js

