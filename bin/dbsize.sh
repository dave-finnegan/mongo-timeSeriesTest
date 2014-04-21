#!/bin/bash

#set -x

scriptnm=`echo $0 | sed 's@.*/\(.*\)@\1@'`

# Default values
dbn="ts"
dbh=localhost
dbp=27017

# Usage function
usage ()
{
  if [ $# -gt 0 ]; then
    echo ""
    echo $1
  fi
  echo ""
  echo "Usage: $scriptnm -db_host host -db_port port -db_name name [-help]"
  echo "Where:"
  echo "  host       hostname of mongod server to connect to"
  echo "  port       port of mongod server to connect to"
  echo "  name       database name to dump "
  echo "  defaults:"
  echo "    dbn: $dbn"
  exit 1
}

# Check for args
[ $# -lt 1 -o $# -gt 4 ] && usage

# Parse the command line
while [ $# -gt 0 ]; do

    case $1 in

        # help
        -h | -help) usage ;;

        # db host
        -dbh | -db_host) dbh=$2 ; shift ;;

        # db port
        -dbp | -db_port) dbp=$2 ; shift ;;

        # db name
        -dbn | -db_name) dbn=$2 ; shift ;;

        # illegal argument
        *) usage "Illegal argument: '$1'" ;;

    esac
    shift

done

# echo "dbn: $dbn"


if [ $dbn == "all" ]; then
  mongo --quiet --host ${dbh} --port ${dbp} ${dbn} <<-eof
	show dbs
	eof
fi

mongo --quiet --host ${dbh} --port ${dbp} ${dbn} <<-eof | grep "ns\|size"
	use $dbn
	db.ts.stats()
eof

