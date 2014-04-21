#!/bin/bash

# load - don't rebuild just for multiple queries!
for bcnt in 25000; do
    for zcnt in 0 25 50 100 250 500 1000; do
        for qcnt in 0; do
            echo -------- z:$zcnt b:$bcnt q:$qcnt --------
            time ./bin/timeSeriesTest.sh -drop -stat -bsiz 1000 -bcnt ${bcnt} -qcnts ${qcnt} -zcnt ${zcnt} -dbn ts-b${bcnt}-z${zcnt} -mdbh localhost -mdbp 27017 -mdbn ts-metrics-b${bcnt} -qids "39,67,430,722" | tee load-ts-z${zcnt}-b${bcnt}-q-${qcnt}.log
        done
    done
done


# query
for bcnt in 25000; do
    for zcnt in 0 25 50 100 250 500 1000; do
        for qcnt in 1; do
            echo -------- b:$bcnt z:$zcnt q:$qcnt --------
            time ./bin/timeSeriesTest.sh -noload -stat -bsiz 1000 -bcnt ${bcnt} -qcnts ${qcnt} -zcnt ${zcnt} -dbn ts-b${bcnt}-z${zcnt} -mdbh localhost -mdbp 27017 -mdbn ts-metrics-b${bcnt} -qids "39,67,430,722" | tee query-ts-z${zcnt}-b${bcnt}-q-${qcnt}.log
        done
    done
done

