#!/bin/bash

#set -x

scriptnm=`echo $0 | sed 's@.*/\(.*\)@\1@'`

# Default values
bsiz=1000
binc=1000
bend=10000
ccnt=10
cinc=10
cend=100
zcnt=100

# Usage function
usage ()
{
  if [ $# -gt 0 ]; then
    echo ""
    echo $1
  fi
  echo ""
  echo "Usage: $scriptnm -batch bsiz binc bend"
  echo "       -count ccnt cinc cend"
  echo "       -compress zcnt"
  echo "       -help"
  echo "Where:"
  echo "  batch      initial batch size, increment, and end value"
  echo "  count      initial batch count, increment, and end value"
  echo "  compress   enable compression with zcnt size blocks"
  echo "  defaults:"
  echo "    bsiz: $bsiz"
  echo "    binc: $binc"
  echo "    bend: $bend"
  echo "    ccnt: $ccnt"
  echo "    cinc: $cinc"
  echo "    cend: $cend"
  echo "    zcnt: $zcnt"
  exit 1
}

# Check for args
[ $# -gt 11 ] && usage "Too many args!"

# Parse the command line
while [ $# -gt 0 ]; do

    case $1 in

        # help
        -h | -help) usage ;;

        # batch args
        -b | -batch) bsiz=$2 ; binc=$3 ; bend=$4 ; shift 3 ;;

        # count args
        -c | -count) ccnt=$2 ; cinc=$3 ; cend=$4 ; shift 3 ;;

        # compress
        -z | -compress) zcnt=$2 ; shift 1 ;;

        # illegal argument
        *) usage "Illegal argument: '$1'" ;;

    esac
    shift

done

# echo "    bsiz: $bsiz"
# echo "    binc: $binc"
# echo "    bend: $bend"
# echo "    ccnt: $ccnt"
# echo "    cinc: $cinc"
# echo "    cend: $cend"

echo "Batch-size,Total,Setup,Load,Load-ave,Batch-cnt,Compress-size"
for bsz in $(seq $bsiz $binc $bend); do
    for cnt in $(seq $ccnt $cinc $cend); do
        timeSeriesTest.sh -drop -stat -dbn ts-${zcnt} -bsiz $bsz -bcnt $cnt -qcnt 0 -zcnt $zcnt | grep -v Total
    done
done

