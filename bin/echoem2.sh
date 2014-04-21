#!/bin/bash

# dmf: needs dbh, dbp switches

# load - don't rebuild just for multiple queries!
for bcnt in 1000 50000; do
    for zcnt in 0 25 50 100 300; do
        for qcnt in 0; do
            #echo -------- z:$zcnt b:$bcnt q:$qcnt --------
            echo ./bin/timeSeriesTest.sh -drop -stat -bsiz 1000 -bcnt ${bcnt} -qcnt ${qcnt} -zcnt ${zcnt} -dbn ts-b${bcnt}-z${zcnt}
        done
    done
done


# query
for bcnt in 1000 50000; do
    for zcnt in 0 25 50 100 200 300; do
        for qcnt in 1 2 4; do
            # echo -------- b:$bcnt z:$zcnt q:$qcnt --------
            echo ./bin/timeSeriesTest.sh -noload -stat -bsiz 1000 -bcnt ${bcnt} -qcnt ${qcnt} -zcnt ${zcnt} -dbn ts-b${bcnt}-z${zcnt}
        done
    done
done

